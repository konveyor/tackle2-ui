import * as React from "react";
import {
  Button,
  Flex,
  FlexItem,
  Label,
  PageSection,
  PageSectionVariants,
  Tab,
  TabTitleText,
  Tabs,
  Text,
  TextContent,
  TextVariants,
  Title,
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
import { SimplePagination } from "@app/shared/components/simple-pagination";
import {
  ConditionalTableBody,
  TableHeaderContentWithControls,
  TableRowContentWithControls,
} from "@app/shared/components/table-controls";
import { useSelectionState } from "@migtools/lib-ui";
import { useFetchRuleReports } from "@app/queries/issues";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import textStyles from "@patternfly/react-styles/css/utilities/Text/text";
import { Link, useLocation } from "react-router-dom";
import { getAffectedAppsUrl } from "./helpers";
import { TableURLParamKeyPrefix } from "@app/Constants";

export enum IssueFilterGroups {
  ApplicationInventory = "Application inventory",
  Issues = "Issues",
}

enum TabKey {
  allIssues = 0,
  singleApp,
}

export const Issues: React.FC = () => {
  const { t } = useTranslation();

  const [activeTabKey, setActiveTabKey] = React.useState<TabKey>(
    TabKey.allIssues
  );

  const tableControlState = useTableControlUrlParams({
    urlParamKeyPrefix: TableURLParamKeyPrefix.issues,
    columnNames: {
      name: "Issue",
      category: "Category",
      source: "Source",
      target: "Target(s)",
      effort: "Effort",
      applications: "Affected applications",
    },
    sortableColumns: ["name", "category", "effort", "applications"],
    initialSort: { columnKey: "name", direction: "asc" },
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

      // TODO: Determine how to parse source and target from ruleReport issue label field.
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
      // TODO: Determine how to parse source and target from ruleReport issue label field.
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
    result: { data: currentPageRuleReports, total: totalItemCount },
    isFetching,
    fetchError,
  } = useFetchRuleReports(
    getHubRequestParams({
      ...tableControlState, // Includes filterState, sortState and paginationState
      hubSortFieldKeys: {
        name: "name",
        category: "category",
        effort: "effort",
        applications: "applications",
      },
    })
  );

  const tableControls = useTableControlProps({
    ...tableControlState, // Includes filterState, sortState and paginationState
    idProperty: "_ui_unique_id",
    currentPageItems: currentPageRuleReports,
    totalItemCount,
    isLoading: isFetching,
    expandableVariant: "single",
    // TODO FIXME - we don't need selectionState but it's required by this hook?
    selectionState: useSelectionState({
      items: currentPageRuleReports,
      isEqual: (a, b) => a._ui_unique_id === b._ui_unique_id,
    }),
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
      getTdProps,
      getExpandedContentTdProps,
    },
    expansionDerivedState: { isCellExpanded },
  } = tableControls;

  const location = useLocation();

  // TODO move the contents of each tab to their own components

  return (
    <>
      <PageSection variant={PageSectionVariants.light} className={spacing.pb_0}>
        <TextContent>
          <Title headingLevel="h1">{t("terms.issues")}</Title>
          <Text component="small">
            This report provides a concise summary of all issues identified.
          </Text>
        </TextContent>
        <Tabs
          className={spacing.mtSm}
          activeKey={activeTabKey}
          onSelect={(_event, tabKey) => setActiveTabKey(tabKey as TabKey)}
        >
          <Tab
            eventKey={TabKey.allIssues}
            title={<TabTitleText>All issues</TabTitleText>}
          />
          <Tab
            eventKey={TabKey.singleApp}
            title={<TabTitleText>Single application</TabTitleText>}
          />
        </Tabs>
      </PageSection>
      <PageSection>
        {activeTabKey === TabKey.allIssues ? (
          <ConditionalRender
            when={isFetching && !(currentPageRuleReports || fetchError)}
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
                      idPrefix="issues-table"
                      isTop
                      paginationProps={paginationProps}
                    />
                  </ToolbarItem>
                </ToolbarContent>
              </Toolbar>
              <TableComposable
                {...tableProps}
                isExpandable
                aria-label="Issues table"
              >
                <Thead>
                  <Tr>
                    <TableHeaderContentWithControls {...tableControls}>
                      <Th {...getThProps({ columnKey: "name" })} />
                      <Th {...getThProps({ columnKey: "category" })} />
                      <Th {...getThProps({ columnKey: "source" })} />
                      <Th {...getThProps({ columnKey: "target" })} />
                      <Th {...getThProps({ columnKey: "effort" })} />
                      <Th {...getThProps({ columnKey: "applications" })} />
                    </TableHeaderContentWithControls>
                  </Tr>
                </Thead>
                <ConditionalTableBody
                  isLoading={isFetching}
                  isError={!!fetchError}
                  isNoData={totalItemCount === 0}
                  numRenderedColumns={numRenderedColumns}
                >
                  {currentPageRuleReports?.map((ruleReport, rowIndex) => {
                    return (
                      <Tbody
                        key={ruleReport._ui_unique_id}
                        isExpanded={isCellExpanded(ruleReport)}
                      >
                        <Tr>
                          <TableRowContentWithControls
                            {...tableControls}
                            item={ruleReport}
                            rowIndex={rowIndex}
                          >
                            <Td
                              width={25}
                              {...getTdProps({ columnKey: "name" })}
                            >
                              {ruleReport.name}
                            </Td>
                            <Td
                              width={15}
                              {...getTdProps({ columnKey: "category" })}
                            >
                              {ruleReport.category}
                            </Td>
                            <Td
                              width={15}
                              {...getTdProps({ columnKey: "source" })}
                            >
                              TODO
                            </Td>
                            <Td
                              width={15}
                              {...getTdProps({ columnKey: "target" })}
                            >
                              TODO
                            </Td>
                            <Td
                              width={10}
                              {...getTdProps({ columnKey: "effort" })}
                            >
                              {ruleReport.effort}
                            </Td>
                            <Td
                              width={20}
                              {...getTdProps({
                                columnKey: "applications",
                              })}
                            >
                              <Tooltip content="View Report">
                                <Button variant="link" isInline>
                                  <Link
                                    to={getAffectedAppsUrl({
                                      ruleReport,
                                      fromFilterValues: filterValues,
                                      fromLocation: location,
                                    })}
                                  >
                                    {ruleReport.applications}
                                  </Link>
                                </Button>
                              </Tooltip>
                            </Td>
                          </TableRowContentWithControls>
                        </Tr>
                        {isCellExpanded(ruleReport) ? (
                          <Tr isExpanded>
                            <Td />
                            <Td
                              {...getExpandedContentTdProps({
                                item: ruleReport,
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
                                          to={getAffectedAppsUrl({
                                            ruleReport,
                                            fromFilterValues: filterValues,
                                            fromLocation: location,
                                          })}
                                        >
                                          {ruleReport.applications} - View
                                          affected applications
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
                                      {/*
                                    // TODO the technologies array was replaced by labels, we need to parse them
                                    {issue.technologies.map((tech) => {
                                      return (
                                        <Label className={spacing.mrSm}>
                                          {tech?.name}
                                        </Label>
                                      );
                                    })}
                                    */}
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
                                      {ruleReport.effort} - what do we show
                                      here?
                                    </div>
                                    <Text
                                      component="h4"
                                      className={`${spacing.mtSm} ${spacing.mbSm} ${textStyles.fontSizeSm} ${textStyles.fontWeightBold}`}
                                    >
                                      Labels
                                    </Text>
                                    <div>
                                      {ruleReport.labels.map((label) => {
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
                idPrefix="issues-table"
                isTop={false}
                paginationProps={paginationProps}
              />
            </div>
          </ConditionalRender>
        ) : activeTabKey === TabKey.singleApp ? (
          <>TODO</>
        ) : null}
      </PageSection>
    </>
  );
};
