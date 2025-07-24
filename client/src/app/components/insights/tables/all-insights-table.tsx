import * as React from "react";
import { useLocation } from "react-router-dom";
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
import { useFetchReportAllInsights } from "@app/queries/analysis";
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

export interface IAllInsightsTableProps {
  onSelectInsight?: (value?: UiAnalysisReportInsight) => void;
  tableAriaLabel?: string;
  tableName?: string;
}

export const AllInsightsTable: React.FC<IAllInsightsTableProps> = ({
  tableAriaLabel = "Insights table",
  tableName = "all-insights-table",
}) => {
  const location = useLocation();

  const filterCategories = useInsightsTableFilters([
    InsightFilterGroups.ApplicationInventory,
    InsightFilterGroups.Insights,
  ]);

  const tableControlState = useTableControlState({
    tableName,
    persistTo: "urlParams",
    persistenceKeyPrefix: TablePersistenceKeyPrefix.insights,
    columnNames: {
      description: "Insight",
      category: "Category",
      source: "Source",
      target: "Target(s)",
      affected: "Affected applications",
    },
    isFilterEnabled: true,
    isSortEnabled: true,
    isPaginationEnabled: true,
    isExpansionEnabled: true,
    sortableColumns: ["description", "category", "affected"],
    initialSort: { columnKey: "description", direction: "asc" },
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
  } = useFetchReportAllInsights(true, hubRequestParams);

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
              <Th {...getThProps({ columnKey: "description" })} />
              <Th {...getThProps({ columnKey: "category" })} />
              <Th {...getThProps({ columnKey: "source" })} />
              <Th {...getThProps({ columnKey: "target" })} />
              <Th {...getThProps({ columnKey: "affected" })} />
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
                    <Td
                      width={30}
                      {...getTdProps({ columnKey: "description" })}
                      modifier="truncate"
                    >
                      <InsightTitleColumn insight={insight} />
                    </Td>
                    <Td width={20} {...getTdProps({ columnKey: "category" })}>
                      {insight.category}
                    </Td>
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
