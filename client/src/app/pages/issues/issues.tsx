import * as React from "react";
import {
  Button,
  Flex,
  FlexItem,
  Label,
  PageSection,
  PageSectionVariants,
  Text,
  TextContent,
  TextVariants,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  Tooltip,
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
import { useFetchCompositeIssues } from "@app/queries/issues";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import textStyles from "@patternfly/react-styles/css/utilities/Text/text";
import { Link } from "react-router-dom";

enum IssueFilterGroups {
  ApplicationInventory = "Application inventory",
  Issues = "Issues",
}
export const Issues: React.FC = () => {
  const { t } = useTranslation();

  const tableControlState = useTableControlUrlParams({
    columnNames: {
      ruleID: "Rule ID",
      category: "Category",
      effort: "Effort",
      affected: "Affected applications",
    },
    sortableColumns: ["ruleID", "category"],
    initialSort: {
      columnKey: "ruleID",
      direction: "asc",
    },
    filterCategories: [
      //TODO: Should this be select filter type using apps available in memory?
      {
        key: "application.name",
        title: t("terms.applicationName"),
        filterGroup: IssueFilterGroups.ApplicationInventory,
        type: FilterType.search,
        placeholderText:
          t("actions.filterBy", {
            what: t("terms.applicationName").toLowerCase(),
          }) + "...",
      },
      {
        key: "tag.id",
        title: t("terms.tag"),
        filterGroup: IssueFilterGroups.ApplicationInventory,
        type: FilterType.search,
        placeholderText:
          t("actions.filterBy", {
            what: t("terms.tag").toLowerCase(),
          }) + "...",
      },
      {
        key: "category",
        title: t("terms.category"),
        filterGroup: IssueFilterGroups.Issues,
        type: FilterType.search,
        placeholderText:
          t("actions.filterBy", {
            what: t("terms.category").toLowerCase(),
          }) + "...",
      },

      // TODO: Determine if we want to be able to filter by nested analysisIssue effort rather than the full sum which is displayed in this table.

      // {
      //   key: "effort",
      //   title: t("terms.effort"),
      //   filterGroup: IssueFilterGroups.Issues,
      //   type: FilterType.numsearch,
      //   placeholderText:
      //     t("actions.filterBy", {
      //       what: t("terms.effort").toLowerCase(),
      //     }) + "...",
      // },

      // TODO: Determine how to parse source and target from composite issue label field.
      // {
      //   key: "tech.source",
      //   title: t("terms.source"),
      //   filterGroup: IssueFilterGroups.Issues,
      //   type: FilterType.search,
      //   placeholderText:
      //     t("actions.filterBy", {
      //       what: t("terms.source").toLowerCase(),
      //     }) + "...",
      // },
      // TODO: Determine how to parse source and target from composite issue label field.
      // {
      //   key: "tech.target",
      //   title: t("terms.target"),
      //   filterGroup: IssueFilterGroups.Issues,
      //   type: FilterType.search,
      //   placeholderText:
      //     t("actions.filterBy", {
      //       what: t("terms.target").toLowerCase(),
      //     }) + "...",
      // },
    ],
    initialItemsPerPage: 10,
  });

  const {
    result: { data: currentPageItems, total: totalItemCount },
    isFetching,
    fetchError,
  } = useFetchCompositeIssues(
    getHubRequestParams({
      ...tableControlState, // Includes filterState, sortState and paginationState
      hubSortFieldKeys: {
        ruleID: "ruleID",
        category: "category",
      },
    })
  );

  const tableControls = useTableControlProps({
    ...tableControlState, // Includes filterState, sortState and paginationState
    idProperty: "ruleID",
    currentPageItems,
    totalItemCount,
    isLoading: isFetching,
    expandableVariant: "single",
    expansionState: useCompoundExpansionState("ruleID"),
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
  console.log("%c Current page items", "color: blue;");
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
                    <Th {...getThProps({ columnKey: "ruleID" })} />
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
                              <Flex>
                                <FlexItem flex={{ default: "flex_1" }}>
                                  <Text
                                    component="h4"
                                    className={`${spacing.mtSm} ${spacing.mbSm} ${textStyles.fontSizeSm} ${textStyles.fontWeightBold}`}
                                  >
                                    Total affected applications
                                  </Text>

                                  <Tooltip content="View Report">
                                    <Button variant="link" isInline>
                                      <Link
                                        to={`/issues/${issue.ruleID}?filter=ruleid~*${issue.ruleID}*~&sort=asc:ruleID&limit=&offset=0`}
                                      >
                                        {issue.affected} - View affected
                                        applications
                                      </Link>
                                    </Button>
                                  </Tooltip>
                                  <Text
                                    component="h4"
                                    className={`${spacing.mtSm} ${spacing.mbSm} ${textStyles.fontSizeSm} ${textStyles.fontWeightBold}`}
                                  >
                                    Target technologies
                                  </Text>
                                  <div>
                                    {issue.technologies.map((tech) => {
                                      return (
                                        <Label className={spacing.mrSm}>
                                          {tech?.name}
                                        </Label>
                                      );
                                    })}
                                  </div>
                                  <Text
                                    component="h4"
                                    className={`${spacing.mtSm} ${spacing.mbSm} ${textStyles.fontSizeSm} ${textStyles.fontWeightBold}`}
                                  >
                                    Source technologies
                                  </Text>
                                  <div>None</div>
                                  <Text
                                    component="h4"
                                    className={`${spacing.mtSm} ${spacing.mbSm} ${textStyles.fontSizeSm} ${textStyles.fontWeightBold}`}
                                  >
                                    Level of effort
                                  </Text>
                                  <div>
                                    {issue.effort} - what do we show here?
                                  </div>
                                  <Text
                                    component="h4"
                                    className={`${spacing.mtSm} ${spacing.mbSm} ${textStyles.fontSizeSm} ${textStyles.fontWeightBold}`}
                                  >
                                    Labels
                                  </Text>
                                  <div>
                                    {issue.labels.map((label) => {
                                      return (
                                        <Label className={spacing.mrSm}>
                                          {label}
                                        </Label>
                                      );
                                    })}
                                  </div>
                                </FlexItem>
                                <FlexItem flex={{ default: "flex_1" }}>
                                  <Text component={TextVariants.h4}>
                                    TODO: Render validation rule description
                                    here when available
                                  </Text>
                                </FlexItem>
                              </Flex>
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
