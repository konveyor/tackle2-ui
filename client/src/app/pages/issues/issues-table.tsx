import * as React from "react";
import { useHistory, useLocation, useRouteMatch } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  Tooltip,
  Flex,
  FlexItem,
  Text,
  Label,
  LabelGroup,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  Title,
  Button,
} from "@patternfly/react-core";
import {
  Table,
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

import { AppPlaceholder } from "@app/components/AppPlaceholder";
import { OptionWithValue, SimpleSelect } from "@app/components/SimpleSelect";
import { TablePersistenceKeyPrefix } from "@app/Constants";
import { useFetchIssueReports, useFetchRuleReports } from "@app/queries/issues";
import {
  FilterType,
  FilterToolbar,
} from "@app/components/FilterToolbar/FilterToolbar";
import { SingleLabelWithOverflow } from "@app/components/SingleLabelWithOverflow";
import { SimplePagination } from "@app/components/SimplePagination";
import {
  TableHeaderContentWithControls,
  ConditionalTableBody,
  TableRowContentWithControls,
} from "@app/components/TableControls";
import {
  useTableControlState,
  useTableControlProps,
  getHubRequestParams,
} from "@app/hooks/table-controls";

import {
  parseReportLabels,
  getIssuesSingleAppSelectedLocation,
  useSharedAffectedApplicationFilterCategories,
  getIssueTitle,
} from "./helpers";
import { IssueFilterGroups } from "./issues";
import {
  AnalysisIssueReport,
  AnalysisRuleReport,
  Application,
} from "@app/api/models";
import { useFetchApplications } from "@app/queries/applications";
import { Paths } from "@app/Paths";
import { AffectedAppsLink } from "./affected-apps-link";
import { ConditionalTooltip } from "@app/components/ConditionalTooltip";
import { IssueDetailDrawer } from "./issue-detail-drawer";
import { IssueDescriptionAndLinks } from "./components/issue-description-and-links";

export interface IIssuesTableProps {
  mode: "allIssues" | "singleApp";
}

export const IssuesTable: React.FC<IIssuesTableProps> = ({ mode }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const history = useHistory();

  const singleAppSelectedMatch = useRouteMatch<{
    applicationId: string;
  }>(Paths.issuesSingleAppSelected);
  const selectedAppId = singleAppSelectedMatch
    ? Number(singleAppSelectedMatch.params.applicationId)
    : null;
  const setSelectedAppId = (applicationId: number) => {
    history.replace(
      getIssuesSingleAppSelectedLocation(applicationId, location)
    );
  };

  const allIssuesSpecificFilterCategories =
    useSharedAffectedApplicationFilterCategories();

  const tableControlState = useTableControlState({
    persistTo: "urlParams",
    persistenceKeyPrefix: TablePersistenceKeyPrefix.issues,
    columnNames: {
      description: "Issue",
      category: "Category",
      source: "Source",
      target: "Target(s)",
      effort: "Effort",
      affected:
        mode === "singleApp" ? "Affected files" : "Affected applications",
    },
    isFilterEnabled: true,
    isSortEnabled: true,
    isPaginationEnabled: true,
    isExpansionEnabled: true,
    sortableColumns: ["description", "category", "effort", "affected"],
    initialSort: { columnKey: "description", direction: "asc" },
    filterCategories: [
      ...(mode === "allIssues" ? allIssuesSpecificFilterCategories : []),
      {
        key: "category",
        title: t("terms.category"),
        filterGroup:
          mode === "allIssues" ? IssueFilterGroups.Issues : undefined,
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
        filterGroup:
          mode === "allIssues" ? IssueFilterGroups.Issues : undefined,
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
        filterGroup:
          mode === "allIssues" ? IssueFilterGroups.Issues : undefined,
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
    expandableVariant: "single",
  });

  const hubRequestParams = getHubRequestParams({
    ...tableControlState, // Includes filterState, sortState and paginationState
    hubSortFieldKeys: {
      description: "description",
      category: "category",
      effort: "effort",
      affected: mode === "singleApp" ? "files" : "applications",
    },
  });

  const issueReportsQuery = useFetchIssueReports(
    selectedAppId || undefined,
    hubRequestParams
  );
  const ruleReportsQuery = useFetchRuleReports(
    mode === "allIssues",
    hubRequestParams
  );
  const {
    result: { data, total: totalReportCount },
    isFetching: isFetchingReports,
    fetchError: reportsFetchError,
  } = mode === "singleApp" ? issueReportsQuery : ruleReportsQuery;
  const currentPageReports = data as (
    | AnalysisRuleReport
    | AnalysisIssueReport
  )[];

  const {
    data: applications,
    isFetching: isFetchingApplications,
    error: applicationsFetchError,
  } = useFetchApplications();
  const selectedApp =
    applications.find((app) => app.id === selectedAppId) || null;

  const fetchError = reportsFetchError || applicationsFetchError;
  const isLoading =
    mode === "allIssues"
      ? isFetchingReports
      : isFetchingReports || isFetchingApplications;

  const tableControls = useTableControlProps({
    ...tableControlState, // Includes filterState, sortState and paginationState
    idProperty: "_ui_unique_id",
    currentPageItems: currentPageReports,
    totalItemCount: totalReportCount,
    isLoading,
    // TODO FIXME - we don't need selectionState but it's required by this hook?
    selectionState: useSelectionState({
      items: currentPageReports,
      isEqual: (a, b) => a._ui_unique_id === b._ui_unique_id,
    }),
  });

  // Only for singleApp mode
  const [activeIssueReportInDetailDrawer, setActiveIssueReportInDetailDrawer] =
    React.useState<AnalysisIssueReport | null>(null);

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

  const appOptions = applications.map(
    (app): OptionWithValue<Application> => ({
      value: app,
      toString: () => app.name,
    })
  );

  if (isLoading && !(currentPageReports || fetchError)) {
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
          {mode === "singleApp" ? (
            <>
              <ToolbarItem>Application:</ToolbarItem>
              <ConditionalTooltip
                isTooltipEnabled={appOptions.length === 0}
                content="No applications available. Add an application on the application inventory page."
              >
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
                  isDisabled={appOptions.length === 0}
                />
              </ConditionalTooltip>
            </>
          ) : null}
          <FilterToolbar
            {...filterToolbarProps}
            isDisabled={mode === "singleApp" && selectedAppId === null}
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
      <Table {...tableProps} aria-label="Issues table">
        <Thead>
          <Tr>
            <TableHeaderContentWithControls {...tableControls}>
              <Th {...getThProps({ columnKey: "description" })} />
              <Th {...getThProps({ columnKey: "category" })} />
              <Th {...getThProps({ columnKey: "source" })} />
              <Th {...getThProps({ columnKey: "target" })} />
              <Th {...getThProps({ columnKey: "effort" })} />
              <Th {...getThProps({ columnKey: "affected" })} />
            </TableHeaderContentWithControls>
          </Tr>
        </Thead>
        <ConditionalTableBody
          isError={!!fetchError}
          isNoData={
            totalReportCount === 0 ||
            (mode === "singleApp" && selectedAppId === null)
          }
          noDataEmptyState={
            mode === "singleApp" && selectedAppId === null ? (
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
          {currentPageReports?.map((report, rowIndex) => {
            const { sources, targets, otherLabels } = parseReportLabels(report);
            return (
              <Tbody
                key={report._ui_unique_id}
                isExpanded={isCellExpanded(report)}
              >
                <Tr {...getTrProps({ item: report })}>
                  <TableRowContentWithControls
                    {...tableControls}
                    item={report}
                    rowIndex={rowIndex}
                  >
                    <Td
                      width={30}
                      {...getTdProps({ columnKey: "description" })}
                      modifier="truncate"
                    >
                      {getIssueTitle(report)}
                    </Td>
                    <Td width={20} {...getTdProps({ columnKey: "category" })}>
                      {report.category}
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
                    <Td width={10} {...getTdProps({ columnKey: "effort" })}>
                      {report.effort}
                    </Td>
                    <Td
                      width={20}
                      {...getTdProps({
                        columnKey: "affected",
                      })}
                    >
                      <Tooltip content="View Report">
                        {mode === "singleApp" ? (
                          <Button
                            variant="link"
                            isInline
                            onClick={() => {
                              setActiveIssueReportInDetailDrawer(
                                report as AnalysisIssueReport
                              );
                            }}
                          >
                            {(report as AnalysisIssueReport).files}
                          </Button>
                        ) : (
                          <AffectedAppsLink
                            ruleReport={report as AnalysisRuleReport}
                            fromFilterValues={filterValues}
                            fromLocation={location}
                            showNumberOnly
                          />
                        )}
                      </Tooltip>
                    </Td>
                  </TableRowContentWithControls>
                </Tr>
                {isCellExpanded(report) ? (
                  <Tr isExpanded>
                    <Td />
                    <Td
                      {...getExpandedContentTdProps({
                        item: report,
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
                              {mode === "singleApp"
                                ? "Total affected files"
                                : "Total affected applications"}
                            </Text>

                            <Tooltip content="View Report">
                              {mode === "singleApp" ? (
                                <Button
                                  variant="link"
                                  isInline
                                  onClick={() => {
                                    setActiveIssueReportInDetailDrawer(
                                      report as AnalysisIssueReport
                                    );
                                  }}
                                >
                                  {(report as AnalysisIssueReport).files} - View
                                  affected files
                                </Button>
                              ) : (
                                <AffectedAppsLink
                                  ruleReport={report as AnalysisRuleReport}
                                  fromFilterValues={filterValues}
                                  fromLocation={location}
                                />
                              )}
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
                            <div>{report.ruleset}</div>
                            <Text
                              component="h4"
                              className={`${spacing.mtSm} ${spacing.mbSm} ${textStyles.fontSizeSm} ${textStyles.fontWeightBold}`}
                            >
                              Rule
                            </Text>
                            <div>{report.rule}</div>
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
                            <IssueDescriptionAndLinks
                              className={spacing.mrLg}
                              description={report.description}
                              links={report.links}
                            />
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
      </Table>
      <SimplePagination
        idPrefix="issues-table"
        isTop={false}
        paginationProps={paginationProps}
      />
      <IssueDetailDrawer
        issueId={activeIssueReportInDetailDrawer?.id || null}
        applicationName={selectedApp?.name || null}
        onCloseClick={() => setActiveIssueReportInDetailDrawer(null)}
      />
    </div>
  );
};
