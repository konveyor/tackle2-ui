import * as React from "react";
import { useHistory, useLocation, useRouteMatch } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Button,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  Title,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  Tooltip,
} from "@patternfly/react-core";
import { Table, Thead, Tr, Th, Tbody, Td } from "@patternfly/react-table";
import {
  ConditionalTableBody,
  TableRowContentWithControls,
  TableHeaderContentWithControls,
} from "@app/components/TableControls";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import CubesIcon from "@patternfly/react-icons/dist/esm/icons/cubes-icon";

import {
  getHubRequestParams,
  useTableControlProps,
  useTableControlState,
} from "@app/hooks/table-controls";
import { TablePersistenceKeyPrefix, UI_UNIQUE_ID } from "@app/Constants";
import {
  Application,
  UiAnalysisReportApplicationInsight,
} from "@app/api/models";
import { HubRequestParams } from "@app/api/models";
import { AnalysisQueryResults } from "@app/queries/analysis";
import { useFetchApplications } from "@app/queries/applications";
import { ConditionalTooltip } from "@app/components/ConditionalTooltip";
import { OptionWithValue, SimpleSelect } from "@app/components/SimpleSelect";
import { AppPlaceholder } from "@app/components/AppPlaceholder";
import { SingleLabelWithOverflow } from "@app/components/SingleLabelWithOverflow";
import { FilterToolbar } from "@app/components/FilterToolbar";
import { SimplePagination } from "@app/components/SimplePagination";

import { parseReportLabels } from "../helpers";
import { InsightExpandedRowContent } from "../components";
import {
  useInsightsTableFilters,
  InsightFilterGroups,
} from "./use-insight-filters";
import { useDynamicColumns, TableColumns } from "./use-dynamic-columns";
import { InsightTitleColumn } from "./column-insight-title";

const useSelectedApplicationId = (
  pathPattern: string,
  keyPrefix: TablePersistenceKeyPrefix
) => {
  const location = useLocation();
  const history = useHistory();

  const routeMatch = useRouteMatch<{
    applicationId: string;
  }>(pathPattern);

  const selectedAppId = routeMatch
    ? Number(routeMatch.params.applicationId)
    : undefined;

  const setSelectedAppId = (applicationId: number) => {
    const existingFiltersParam =
      location &&
      new URLSearchParams(location.search).get(`${keyPrefix}:filters`);

    history.replace({
      pathname: pathPattern.replace(":applicationId", String(applicationId)),
      search: existingFiltersParam
        ? new URLSearchParams({ filters: existingFiltersParam }).toString()
        : undefined,
    });
  };

  return { selectedAppId, setSelectedAppId };
};

export interface ISingleApplicationInsightsTableProps {
  tableAriaLabel: string;
  tableName: string;
  pathPattern: string;
  keyPrefix: TablePersistenceKeyPrefix;
  columns?: Partial<TableColumns>;
  useFetchData: (
    applicationId?: number,
    params?: HubRequestParams,
    refetchInterval?: number | false
  ) => AnalysisQueryResults<UiAnalysisReportApplicationInsight>;
  onInsightClick: (insight: UiAnalysisReportApplicationInsight) => void;
}

export const SingleApplicationInsightsTable: React.FC<
  ISingleApplicationInsightsTableProps
> = ({
  tableAriaLabel,
  tableName,
  pathPattern,
  keyPrefix,
  columns,
  useFetchData,
  onInsightClick,
}) => {
  const { t } = useTranslation();

  const { selectedAppId, setSelectedAppId } = useSelectedApplicationId(
    pathPattern,
    keyPrefix
  );

  const columnNames = useDynamicColumns(columns, {
    affected: "Affected applications",
  });
  const sortableColumns = ["description", "category", "affected"].filter(
    (key) => columnNames[key]
  );
  const filterCategories =
    useInsightsTableFilters<UiAnalysisReportApplicationInsight>([
      InsightFilterGroups.Insights,
    ]);
  const tableControlState = useTableControlState({
    tableName,
    persistTo: "urlParams",
    persistenceKeyPrefix: TablePersistenceKeyPrefix.insights,
    columnNames,
    isFilterEnabled: true,
    isSortEnabled: true,
    isPaginationEnabled: true,
    isExpansionEnabled: true,
    sortableColumns,
    initialSort: { columnKey: sortableColumns[0], direction: "asc" },
    filterCategories,
    initialItemsPerPage: 10,
    expandableVariant: "single",
  });
  const hubRequestParams = getHubRequestParams({
    ...tableControlState, // Includes filterState, sortState and paginationState
    hubSortFieldKeys: {
      description: "description",
      category: "category",
      affected: "files",
    },
  });

  const {
    result: { data: currentPageItems, total: totalItemCount },
    isFetching: isLoading,
    fetchError,
  } = useFetchData(selectedAppId, hubRequestParams);

  const tableControls = useTableControlProps({
    ...tableControlState, // Includes filterState, sortState and paginationState
    idProperty: UI_UNIQUE_ID,
    currentPageItems,
    totalItemCount,
    isLoading,
  });
  const {
    numRenderedColumns,
    propHelpers: {
      toolbarProps,
      filterToolbarProps,
      paginationToolbarItemProps,
      paginationProps,
      tableProps,
      getThProps,
      getTrProps,
      getTdProps,
      getExpandedContentTdProps,
    },
    expansionDerivedState: { isCellExpanded },
  } = tableControls;

  const { data: applications } = useFetchApplications();
  const applicationOptions: OptionWithValue<Application>[] = applications.map(
    (app) => ({
      value: app,
      toString: () => app.name,
    })
  );

  if (isLoading && !(currentPageItems || fetchError)) {
    return <AppPlaceholder />;
  }
  return (
    <div
      style={{
        backgroundColor: "var(--pf-v5-global--BackgroundColor--100)",
      }}
    >
      <Toolbar {...toolbarProps}>
        <ToolbarContent>
          <ToolbarItem>Application:</ToolbarItem>
          <ConditionalTooltip
            isTooltipEnabled={applicationOptions.length === 0}
            content="No applications available. Add an application on the application inventory page."
          >
            <SimpleSelect
              toggleAriaLabel="application-select"
              toggleId="application-select"
              width={220}
              aria-label="Select application"
              placeholderText="Select application..."
              hasInlineFilter
              value={applicationOptions.find(
                (option) => option.value.id === selectedAppId
              )}
              options={applicationOptions}
              onChange={(option) => {
                setSelectedAppId(
                  (option as OptionWithValue<Application>).value.id
                );
              }}
              className={spacing.mrMd}
              isDisabled={applicationOptions.length === 0}
            />
          </ConditionalTooltip>

          <FilterToolbar
            {...filterToolbarProps}
            isDisabled={selectedAppId === null}
          />
          <ToolbarItem {...paginationToolbarItemProps}>
            <SimplePagination
              idPrefix="s-table"
              isTop
              paginationProps={paginationProps}
            />
          </ToolbarItem>
        </ToolbarContent>
      </Toolbar>
      <Table {...tableProps} aria-label={tableAriaLabel || "Insights table"}>
        <Thead>
          <Tr>
            <TableHeaderContentWithControls {...tableControls}>
              {columnNames.description && (
                <Th {...getThProps({ columnKey: "description" })} />
              )}
              {columnNames.category && (
                <Th {...getThProps({ columnKey: "category" })} />
              )}
              {columnNames.source && (
                <Th {...getThProps({ columnKey: "source" })} />
              )}
              {columnNames.target && (
                <Th {...getThProps({ columnKey: "target" })} />
              )}
              {columnNames.effort && (
                <Th
                  {...getThProps({ columnKey: "effort" })}
                  info={{
                    tooltip: `${t("message.issuesEffortTooltip")}`,
                  }}
                />
              )}
              {columnNames.affected && (
                <Th {...getThProps({ columnKey: "affected" })} />
              )}
            </TableHeaderContentWithControls>
          </Tr>
        </Thead>
        <ConditionalTableBody
          isError={!!fetchError}
          isNoData={totalItemCount === 0 || selectedAppId === null}
          noDataEmptyState={
            selectedAppId === null ? (
              <EmptyState variant="sm">
                <EmptyStateIcon icon={CubesIcon} />
                <Title headingLevel="h2" size="lg">
                  Select application from filter menu
                </Title>
                <EmptyStateBody>
                  Use the filter menu above to select your application.
                </EmptyStateBody>
              </EmptyState>
            ) : null
          }
          numRenderedColumns={numRenderedColumns}
        >
          {currentPageItems?.map((insight, rowIndex) => {
            const { sources, targets } = parseReportLabels(insight);
            return (
              <Tbody
                key={insight._ui_unique_id}
                isExpanded={isCellExpanded(insight)}
              >
                <Tr {...getTrProps({ item: insight })}>
                  <TableRowContentWithControls
                    {...tableControls}
                    item={insight}
                    rowIndex={rowIndex}
                  >
                    {columnNames.description && (
                      <Td
                        width={30}
                        {...getTdProps({ columnKey: "description" })}
                        modifier="truncate"
                      >
                        <InsightTitleColumn insight={insight} />
                      </Td>
                    )}
                    {columnNames.category && (
                      <Td width={20} {...getTdProps({ columnKey: "category" })}>
                        {insight.category}
                      </Td>
                    )}
                    {columnNames.source && (
                      <Td
                        width={10}
                        modifier="nowrap"
                        noPadding
                        {...getTdProps({ columnKey: "source" })}
                      >
                        <SingleLabelWithOverflow
                          labels={sources}
                          popoverAriaLabel="More sources"
                        />
                      </Td>
                    )}
                    {columnNames.target && (
                      <Td
                        width={10}
                        modifier="nowrap"
                        noPadding
                        {...getTdProps({ columnKey: "target" })}
                      >
                        <SingleLabelWithOverflow
                          labels={targets}
                          popoverAriaLabel="More sources"
                        />
                      </Td>
                    )}
                    {columnNames.effort && (
                      <Td width={20} {...getTdProps({ columnKey: "effort" })}>
                        {insight.effort}
                      </Td>
                    )}
                    {columnNames.affected && (
                      <Td
                        width={20}
                        {...getTdProps({
                          columnKey: "affected",
                        })}
                      >
                        <Tooltip content="View Report">
                          <Button
                            variant="link"
                            isInline
                            onClick={() => {
                              onInsightClick(insight);
                            }}
                          >
                            {insight.files}
                          </Button>
                        </Tooltip>
                      </Td>
                    )}
                  </TableRowContentWithControls>
                </Tr>
                {isCellExpanded(insight) ? (
                  <Tr isExpanded>
                    <Td />
                    <Td
                      {...getExpandedContentTdProps({ item: insight })}
                      className={spacing.pyLg}
                    >
                      <InsightExpandedRowContent
                        insight={insight}
                        totalAffectedLabel="Total affected files"
                        totalAffected={
                          <Tooltip content="View Report">
                            <Button
                              variant="link"
                              isInline
                              onClick={() => {
                                onInsightClick(insight);
                              }}
                            >
                              {insight.files} - View affected files
                            </Button>
                          </Tooltip>
                        }
                      />
                    </Td>
                  </Tr>
                ) : null}
              </Tbody>
            );
          })}
        </ConditionalTableBody>
      </Table>
      <SimplePagination // TODO: Wrap in Toolbar?
        idPrefix="insights-table"
        isTop={false}
        paginationProps={paginationProps}
      />
    </div>
  );
};
