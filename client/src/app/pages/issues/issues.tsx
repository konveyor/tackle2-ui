import * as React from "react";
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  PageSection,
  PageSectionVariants,
  Text,
  TextContent,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from "@patternfly/react-core";
import { useTranslation } from "react-i18next";
import { AppPlaceholder, ConditionalRender } from "@app/shared/components";
import {
  FilterToolbar,
  FilterType,
} from "@app/shared/components/FilterToolbar";
import {
  ExpandableRowContent,
  TableComposable,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@patternfly/react-table";
import {
  useTableControlUrlParams,
  useTableControlProps,
  getHubRequestParams,
} from "@app/shared/hooks/table-controls";
import { useCompoundExpansionState } from "@app/shared/hooks/useCompoundExpansionState";
import { SimplePagination } from "@app/shared/components/simple-pagination";
import {
  ConditionalTableBody,
  TableHeaderContentWithControls,
  TableRowContentWithControls,
} from "@app/shared/components/table-controls";
import { useSelectionState } from "@migtools/lib-ui";
import { useFetchIssues } from "@app/queries/issues";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

export const Issues: React.FC = () => {
  const { t } = useTranslation();

  const tableControlState = useTableControlUrlParams({
    columnNames: {
      ruleID: "Rule ID",
      category: "Category",
      effort: "Effort",
      affected: "Affected applications",
    },
    sortableColumns: ["ruleID", "category", "effort"],
    initialSort: {
      columnKey: "ruleID",
      direction: "asc",
    },
    filterCategories: [
      {
        key: "ruleId",
        title: t("terms.name"),
        type: FilterType.search,
        placeholderText:
          t("actions.filterBy", {
            what: t("terms.name").toLowerCase(),
          }) + "...",
      },
    ],
    initialItemsPerPage: 10,
  });

  const {
    result: { data: currentPageItems, total: totalItemCount },
    isFetching,
    fetchError,
  } = useFetchIssues(
    getHubRequestParams({
      ...tableControlState, // Includes filterState, sortState and paginationState
      hubSortFieldKeys: {
        ruleID: "ruleID",
        category: "category",
        effort: "effort",
      },
    })
  );

  const tableControls = useTableControlProps({
    ...tableControlState, // Includes filterState, sortState and paginationState
    idProperty: "name",
    currentPageItems,
    totalItemCount,
    isLoading: isFetching,
    expansionState: useCompoundExpansionState("name"),
    selectionState: useSelectionState({
      items: currentPageItems,
      isEqual: (a, b) => a.name === b.name,
    }),
  });

  const {
    numRenderedColumns,
    expansionState: { isCellExpanded },
    propHelpers: {
      toolbarProps,
      filterToolbarProps,
      paginationToolbarItemProps,
      paginationProps,
      tableProps,
      getThProps,
      getTdProps,
      getSingleExpandTdProps,
      getExpandedContentTdProps,
    },
  } = tableControls;
  console.log({ currentPageItems, totalItemCount });

  return (
    <>
      <PageSection variant={PageSectionVariants.light}>
        <TextContent>
          <Text component="h1">{t("terms.issues")}</Text>
        </TextContent>
      </PageSection>
      <PageSection>
        <ConditionalRender
          when={isFetching && !(currentPageItems || fetchError)}
          then={<AppPlaceholder />}
        >
          <div
            style={{
              backgroundColor: "var(--pf-global--BackgroundColor--100)",
            }}
          >
            <Toolbar {...toolbarProps}>
              <ToolbarContent>
                <FilterToolbar {...filterToolbarProps} />
                <ToolbarItem {...paginationToolbarItemProps}>
                  <SimplePagination
                    idPrefix="dependencies-table"
                    isTop
                    paginationProps={paginationProps}
                  />
                </ToolbarItem>
              </ToolbarContent>
            </Toolbar>
            <TableComposable
              {...tableProps}
              isExpandable
              aria-label="Migration waves table"
            >
              <Thead>
                <Tr>
                  <TableHeaderContentWithControls {...tableControls}>
                    <Th {...getThProps({ columnKey: "ruleId" })} />
                    <Th {...getThProps({ columnKey: "category" })} />
                    <Th {...getThProps({ columnKey: "effort" })} />
                    <Th {...getThProps({ columnKey: "affected" })} />
                  </TableHeaderContentWithControls>
                </Tr>
              </Thead>
              <ConditionalTableBody
                isLoading={isFetching}
                isError={!!fetchError}
                isNoData={totalItemCount === 0}
                numRenderedColumns={numRenderedColumns}
              >
                {currentPageItems?.map((issue, rowIndex) => {
                  return (
                    <Tbody
                      key={issue.ruleID}
                      isExpanded={isCellExpanded(issue)}
                    >
                      <Tr>
                        <TableRowContentWithControls
                          {...tableControls}
                          item={issue}
                          rowIndex={rowIndex}
                        >
                          <Td
                            {...getSingleExpandTdProps({
                              item: issue,
                              rowIndex,
                            })}
                          />
                          <Td
                            width={25}
                            {...getTdProps({ columnKey: "ruleId" })}
                          >
                            {issue.ruleID}
                          </Td>
                          <Td
                            width={10}
                            {...getTdProps({ columnKey: "category" })}
                          >
                            {issue.category}
                          </Td>
                          <Td
                            width={10}
                            {...getTdProps({ columnKey: "effort" })}
                          >
                            {issue.effort}
                          </Td>
                          <Td
                            width={10}
                            {...getTdProps({
                              columnKey: "affected",
                            })}
                          >
                            {issue.affected}
                          </Td>
                        </TableRowContentWithControls>
                      </Tr>
                      {isCellExpanded(issue) ? (
                        <Tr isExpanded>
                          <Td />
                          <Td
                            {...getExpandedContentTdProps({
                              item: issue,
                            })}
                            className={spacing.pyLg}
                          >
                            <ExpandableRowContent>
                              <DescriptionList>
                                <DescriptionListGroup>
                                  <DescriptionListTerm>
                                    {t("terms.group(s)")}
                                  </DescriptionListTerm>
                                  {!!issue.affected && (
                                    <DescriptionListDescription>
                                      {/* {issue} */}
                                      {/* {issue.
                                        ?.map((f) => f.name)
                                        .join(", ")} */}
                                    </DescriptionListDescription>
                                  )}
                                </DescriptionListGroup>
                              </DescriptionList>
                            </ExpandableRowContent>
                          </Td>
                        </Tr>
                      ) : null}
                    </Tbody>
                  );
                })}
              </ConditionalTableBody>
            </TableComposable>
            <SimplePagination
              idPrefix="dependencies-table"
              isTop={false}
              paginationProps={paginationProps}
            />
          </div>
        </ConditionalRender>
      </PageSection>
    </>
  );
};
