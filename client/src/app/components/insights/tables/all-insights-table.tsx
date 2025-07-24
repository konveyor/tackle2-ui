import * as React from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
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

import {
  getHubRequestParams,
  useTableControlProps,
  useTableControlState,
} from "@app/hooks/table-controls";
import { TablePersistenceKeyPrefix, UI_UNIQUE_ID } from "@app/Constants";
import { UiAnalysisReportInsight } from "@app/api/models";
import { HubRequestParams } from "@app/api/models";
import { AnalysisQueryResults } from "@app/queries/analysis";
import { AppPlaceholder } from "../../AppPlaceholder";
import { SingleLabelWithOverflow } from "../../SingleLabelWithOverflow";
import { FilterToolbar } from "../../FilterToolbar";
import { SimplePagination } from "../../SimplePagination";

import {
  useInsightsTableFilters,
  InsightFilterGroups,
} from "../use-insight-filters";
import { parseReportLabels } from "../helpers";
import { AffectedAppsLink, InsightExpandedRowContent } from "../components";

import { InsightTitleColumn } from "./column-insight-title";

interface TableColumns {
  description: boolean | string;
  category: boolean | string;
  source: boolean | string;
  target: boolean | string;
  effort: boolean | string;
  affected: boolean | string;
}
export interface IAllInsightsTableProps {
  tableAriaLabel?: string;
  tableName?: string;
  columns?: Partial<TableColumns>;
  useFetchData: (
    enabled: boolean,
    params: HubRequestParams
  ) => AnalysisQueryResults<UiAnalysisReportInsight>;
}

const useDynamicColumns = (columns?: Partial<TableColumns>) => {
  const defaultNames = {
    description: "Insight",
    category: "Category",
    source: "Source",
    target: "Target(s)",
    effort: "Effort",
    affected: "Affected applications",
  };

  const fullSet: TableColumns = Object.assign(
    {
      description: true,
      category: true,
      source: true,
      target: true,
      effort: false,
      affected: true,
    },
    columns
  );

  const activeSet: Record<string, string> = {};
  Object.entries(fullSet).forEach(([key, value]) => {
    if (typeof value === "string") {
      activeSet[key] = value;
    } else if (value === true) {
      activeSet[key] = defaultNames[key as keyof typeof defaultNames];
    }
  });
  return activeSet;
};

export const AllInsightsTable: React.FC<IAllInsightsTableProps> = ({
  tableAriaLabel = "Insights table",
  tableName = "all-insights-table",
  columns,
  useFetchData,
}) => {
  const { t } = useTranslation();
  const location = useLocation();

  const columnNames = useDynamicColumns(columns);
  const sortableColumns = ["description", "category", "affected"].filter(
    (key) => columnNames[key]
  );

  const filterCategories = useInsightsTableFilters([
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
                          <AffectedAppsLink
                            ruleReport={insight as UiAnalysisReportInsight}
                            fromFilterValues={filterValues}
                            fromLocation={location}
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
                              ruleReport={insight as UiAnalysisReportInsight}
                              fromFilterValues={filterValues}
                              fromLocation={location}
                              showNumberOnly
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
      <SimplePagination // TODO: Wrap in Toolbar?
        idPrefix="insights-table"
        isTop={false}
        paginationProps={paginationProps}
      />
    </div>
  );
};
