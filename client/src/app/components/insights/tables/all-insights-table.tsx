import * as React from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import {
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  Tooltip,
} from "@patternfly/react-core";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";

import { TablePersistenceKeyPrefix, UI_UNIQUE_ID } from "@app/Constants";
import { Paths } from "@app/Paths";
import { UiAnalysisReportInsight } from "@app/api/models";
import { HubRequestParams } from "@app/api/models";
import { AppPlaceholder } from "@app/components/AppPlaceholder";
import { FilterToolbar } from "@app/components/FilterToolbar";
import { SimplePagination } from "@app/components/SimplePagination";
import { SingleLabelWithOverflow } from "@app/components/SingleLabelWithOverflow";
import {
  ConditionalTableBody,
  TableHeaderContentWithControls,
  TableRowContentWithControls,
} from "@app/components/TableControls";
import {
  getHubRequestParams,
  useTableControlProps,
  useTableControlState,
} from "@app/hooks/table-controls";
import { AnalysisQueryResults } from "@app/queries/analysis";

import { AffectedAppsLink, InsightExpandedRowContent } from "../components";
import { parseReportLabels } from "../helpers";

import { InsightTitleColumn } from "./column-insight-title";
import { TableColumns, useDynamicColumns } from "./use-dynamic-columns";
import {
  InsightFilterGroups,
  useInsightsTableFilters,
} from "./use-insight-filters";

export interface IAllInsightsTableProps {
  tableAriaLabel?: string;
  tableName?: string;
  affectedAppsPath?: string;
  columns?: Partial<TableColumns>;
  useFetchData: (
    enabled: boolean,
    params: HubRequestParams
  ) => AnalysisQueryResults<UiAnalysisReportInsight>;
}

export const AllInsightsTable: React.FC<IAllInsightsTableProps> = ({
  tableAriaLabel = "Insights table",
  tableName = "all-insights-table",
  affectedAppsPath = Paths.insightsAllAffectedApplications,
  columns,
  useFetchData,
}) => {
  const { t } = useTranslation();
  const location = useLocation();

  const columnNames = useDynamicColumns(columns);
  const sortableColumns = ["description", "category", "affected"].filter(
    (key) => columnNames[key]
  );
  const filterCategories = useInsightsTableFilters<UiAnalysisReportInsight>([
    InsightFilterGroups.ApplicationInventory,
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
      affected: "applications",
    },
  });

  const {
    result: { data: currentPageItems, total: totalItemCount },
    isFetching: isLoading,
    fetchError,
  } = useFetchData(true, hubRequestParams);

  const tableControls = useTableControlProps({
    ...tableControlState, // Includes filterState, sortState and paginationState
    idProperty: UI_UNIQUE_ID,
    currentPageItems,
    totalItemCount,
    isLoading,
  });
  const {
    numRenderedColumns,
    filterState: { filterValues },
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
          <FilterToolbar {...filterToolbarProps} />
          <ToolbarItem {...paginationToolbarItemProps}>
            <SimplePagination
              idPrefix={tableName}
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
          isNoData={totalItemCount === 0}
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
                          popoverAriaLabel="More targets"
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
                          <AffectedAppsLink
                            ruleReport={insight}
                            fromFilterValues={filterValues}
                            fromLocation={location}
                            toPath={affectedAppsPath}
                            showNumberOnly
                          />
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
                        totalAffectedLabel="Total affected applications"
                        totalAffected={
                          <Tooltip content="View Report">
                            <AffectedAppsLink
                              ruleReport={insight}
                              fromFilterValues={filterValues}
                              fromLocation={location}
                              showNumberOnly={false}
                              toPath={affectedAppsPath}
                            />
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
      <SimplePagination
        idPrefix={tableName}
        isTop={false}
        paginationProps={paginationProps}
      />
    </div>
  );
};
