import * as React from "react";
import { Link, useHistory, useLocation, useRouteMatch } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  Tooltip,
  Button,
  Flex,
  FlexItem,
  Text,
  Label,
  LabelGroup,
  TextVariants,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  Title,
} from "@patternfly/react-core";
import {
  TableComposable,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
  ExpandableRowContent,
} from "@patternfly/react-table";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import textStyles from "@patternfly/react-styles/css/utilities/Text/text";
import CubesIcon from "@patternfly/react-icons/dist/esm/icons/cubes-icon";
import { useSelectionState } from "@migtools/lib-ui";
import {
  AppPlaceholder,
  OptionWithValue,
  SimpleSelect,
} from "@app/shared/components";
import { TableURLParamKeyPrefix } from "@app/Constants";
import { useFetchRuleReports } from "@app/queries/issues";
import {
  FilterType,
  FilterToolbar,
} from "@app/shared/components/FilterToolbar";
import { SingleLabelWithOverflow } from "@app/shared/components/SingleLabelWithOverflow";
import { SimplePagination } from "@app/shared/components/simple-pagination";
import {
  TableHeaderContentWithControls,
  ConditionalTableBody,
  TableRowContentWithControls,
} from "@app/shared/components/table-controls";
import {
  useTableControlUrlParams,
  getHubRequestParams,
  useTableControlProps,
} from "@app/shared/hooks/table-controls";

import {
  useSharedFilterCategoriesForIssuesAndAffectedApps,
  parseRuleReportLabels,
  getAffectedAppsUrl,
  getSingleAppSelectedLocation,
} from "./helpers";
import { IssueFilterGroups } from "./issues";
import { Application } from "@app/api/models";
import { useFetchApplications } from "@app/queries/applications";
import { Paths } from "@app/Paths";

export interface IIssuesTableProps {
  mode: "allIssues" | "singleApp";
}

export const IssuesTable: React.FC<IIssuesTableProps> = ({ mode }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const history = useHistory();

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
      ...useSharedFilterCategoriesForIssuesAndAffectedApps(),
      {
        key: "category",
        title: t("terms.category"),
        filterGroup: IssueFilterGroups.Issues,
        type: FilterType.search,
        placeholderText:
          t("actions.filterBy", {
            what: t("terms.category").toLowerCase(),
          }) + "...",
        getServerFilterValue: (value) => (value ? [`*${value[0]}*`] : []),
      },
      {
        key: "source",
        title: t("terms.source"),
        filterGroup: IssueFilterGroups.Issues,
        type: FilterType.search,
        placeholderText:
          t("actions.filterBy", {
            what: t("terms.source").toLowerCase(),
          }) + "...",
        serverFilterField: "labels",
        getServerFilterValue: (value) =>
          value?.length === 1 ? [`konveyor.io/source=*${value}*`] : undefined,
      },
      {
        key: "target",
        title: t("terms.target"),
        filterGroup: IssueFilterGroups.Issues,
        type: FilterType.search,
        placeholderText:
          t("actions.filterBy", {
            what: t("terms.target").toLowerCase(),
          }) + "...",
        serverFilterField: "labels",
        getServerFilterValue: (value) =>
          value?.length === 1 ? [`konveyor.io/target=*${value}*`] : undefined,
      },
      // TODO: Determine if we want to be able to filter by nested analysisIssue effort rather than the full sum which is displayed in this table.
      // TODO: Determine if we want to filter by effort at all without having a numeric range filter control
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
    ],
    initialItemsPerPage: 10,
  });

  const {
    result: { data: currentPageRuleReports, total: totalItemCount },
    isFetching: isFetchingRuleReports,
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

  const singleAppSelectedMatch = useRouteMatch<{
    applicationId: string;
  }>(Paths.issuesSingleAppSelected);
  const selectedAppId = singleAppSelectedMatch
    ? Number(singleAppSelectedMatch.params.applicationId)
    : null;
  const setSelectedAppId = (applicationId: number) => {
    history.replace(getSingleAppSelectedLocation(applicationId, location));
  };

  console.log({ selectedAppId });

  const { data: applications, isFetching: isFetchingApplications } =
    useFetchApplications();

  const isLoading =
    mode === "allIssues" ? isFetchingRuleReports : isFetchingApplications;

  const tableControls = useTableControlProps({
    ...tableControlState, // Includes filterState, sortState and paginationState
    idProperty: "_ui_unique_id",
    currentPageItems: currentPageRuleReports,
    totalItemCount,
    isLoading,
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

  const appOptions = applications.map(
    (app): OptionWithValue<Application> => ({
      value: app,
      toString: () => app.name,
    })
  );

  if (isLoading && !(currentPageRuleReports || fetchError)) {
    // TODO swap for currentPageItems
    return <AppPlaceholder />;
  }

  return (
    <div
      style={{
        backgroundColor: "var(--pf-global--BackgroundColor--100)",
      }}
    >
      <Toolbar {...toolbarProps}>
        <ToolbarContent>
          {mode === "singleApp" ? (
            <>
              <ToolbarItem>Application:</ToolbarItem>
              <SimpleSelect
                toggleAriaLabel="application-select"
                toggleId="application-select"
                width={220}
                aria-label="Select application"
                placeholderText="Select application..."
                hasInlineFilter
                value={appOptions.find(
                  (option) => option.value.id === selectedAppId
                )}
                options={appOptions}
                onChange={(option) => {
                  setSelectedAppId(
                    (option as OptionWithValue<Application>).value.id
                  );
                }}
                className={spacing.mrMd}
              />
            </>
          ) : null}
          <FilterToolbar
            {...filterToolbarProps}
            isDisabled={mode === "singleApp" && selectedAppId === null}
          />
          <ToolbarItem {...paginationToolbarItemProps}>
            <SimplePagination
              idPrefix="issues-table"
              isTop
              paginationProps={paginationProps}
            />
          </ToolbarItem>
        </ToolbarContent>
      </Toolbar>
      <TableComposable {...tableProps} isExpandable aria-label="Issues table">
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
          isError={!!fetchError}
          isNoData={
            totalItemCount === 0 ||
            (mode === "singleApp" && selectedAppId === null)
          }
          noDataEmptyState={
            mode === "singleApp" ? (
              <EmptyState variant="small">
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
          {currentPageRuleReports?.map((ruleReport, rowIndex) => {
            const { sources, targets, otherLabels } =
              parseRuleReportLabels(ruleReport);
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
                    <Td width={25} {...getTdProps({ columnKey: "name" })}>
                      {ruleReport.name}
                    </Td>
                    <Td width={15} {...getTdProps({ columnKey: "category" })}>
                      {ruleReport.category}
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
                      width={20}
                      modifier="nowrap"
                      noPadding
                      {...getTdProps({ columnKey: "target" })}
                    >
                      <SingleLabelWithOverflow
                        labels={targets}
                        popoverAriaLabel="More sources"
                      />
                    </Td>
                    <Td width={10} {...getTdProps({ columnKey: "effort" })}>
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
                                  {ruleReport.applications} - View affected
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
                              {targets.length > 0
                                ? targets.map((target) => (
                                    <Label
                                      key={target}
                                      className={spacing.mrSm}
                                    >
                                      {target}
                                    </Label>
                                  ))
                                : "None"}
                            </div>
                            <Text
                              component="h4"
                              className={`${spacing.mtSm} ${spacing.mbSm} ${textStyles.fontSizeSm} ${textStyles.fontWeightBold}`}
                            >
                              Source technologies
                            </Text>
                            <div>
                              {sources.length > 0
                                ? sources.map((source) => (
                                    <Label
                                      key={source}
                                      className={spacing.mrSm}
                                    >
                                      {source}
                                    </Label>
                                  ))
                                : "None"}
                            </div>
                            <Text
                              component="h4"
                              className={`${spacing.mtSm} ${spacing.mbSm} ${textStyles.fontSizeSm} ${textStyles.fontWeightBold}`}
                            >
                              Rule set
                            </Text>
                            <div>{ruleReport.ruleset}</div>
                            <Text
                              component="h4"
                              className={`${spacing.mtSm} ${spacing.mbSm} ${textStyles.fontSizeSm} ${textStyles.fontWeightBold}`}
                            >
                              Rule
                            </Text>
                            <div>{ruleReport.rule}</div>
                            <Text
                              component="h4"
                              className={`${spacing.mtSm} ${spacing.mbSm} ${textStyles.fontSizeSm} ${textStyles.fontWeightBold}`}
                            >
                              Labels
                            </Text>
                            <div>
                              {otherLabels.length > 0 ? (
                                <LabelGroup>
                                  {otherLabels.map((label) => (
                                    <Label key={label} className={spacing.mrSm}>
                                      {label}
                                    </Label>
                                  ))}
                                </LabelGroup>
                              ) : (
                                "None"
                              )}
                            </div>
                          </FlexItem>
                          <FlexItem flex={{ default: "flex_1" }}>
                            <Text component={TextVariants.h4}>
                              {ruleReport.description}
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
  );
};
