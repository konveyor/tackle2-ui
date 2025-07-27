import * as React from "react";
import { Link, useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
  TextContent,
  Text,
  TextVariants,
  Title,
  Tabs,
  Tab,
  TabTitleText,
  Spinner,
  Bullseye,
  List,
  ListItem,
  Button,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Divider,
  Tooltip,
} from "@patternfly/react-core";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import CheckCircleIcon from "@patternfly/react-icons/dist/esm/icons/check-circle-icon";
import ExclamationCircleIcon from "@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon";

import { Identity, MimeType, Manifest, Archetype } from "@app/api/models";
import { COLOR_HEX_VALUES_BY_NAME } from "@app/Constants";
import { useFetchFacts } from "@app/queries/facts";
import { useFetchIdentities } from "@app/queries/identities";
import { useSetting } from "@app/queries/settings";
import { getKindIdByRef } from "@app/utils/model-utils";

import {
  getDependenciesUrlFilteredByAppName,
  getIssuesSingleAppSelectedLocation,
} from "@app/pages/issues/helpers";
import {
  IPageDrawerContentProps,
  PageDrawerContent,
} from "@app/components/PageDrawerContext";
import { EmptyTextMessage } from "@app/components/EmptyTextMessage";
import { LabelsFromItems } from "@app/components/labels/labels-from-items/labels-from-items";
import { RiskLabel } from "@app/components/RiskLabel";
import { ReviewFields } from "@app/components/detail-drawer/review-fields";

import { ApplicationTags } from "../application-tags";
import DownloadButton from "./components/download-button";
import { ApplicationDetailFields } from "./application-detail-fields";
import { ApplicationFacts } from "./application-facts";
import { formatPath } from "@app/utils/utils";
import { Paths } from "@app/Paths";
import { DecoratedApplication } from "../../useDecoratedApplications";
import { TaskStates } from "@app/queries/tasks";
import { useFetchIssueReports } from "@app/queries/issues";
import { fork } from "radash";
import { Toolbar, ToolbarContent, ToolbarItem } from "@patternfly/react-core";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import { SimplePagination } from "@app/components/SimplePagination";
import { useServerTasks } from "@app/queries/tasks";
import { FilterToolbar, FilterType } from "@app/components/FilterToolbar";
import {
  useTableControlState,
  useTableControlProps,
  getHubRequestParams,
  deserializeFilterUrlParams,
} from "@app/hooks/table-controls";
import { TablePersistenceKeyPrefix } from "@app/Constants";
import { TaskActionColumn } from "@app/pages/tasks/TaskActionColumn";
import {
  ConditionalTableBody,
  TableHeaderContentWithControls,
  TableRowContentWithControls,
} from "@app/components/TableControls";
import { IconWithLabel, TaskStateIcon } from "@app/components/Icons";
import { taskStateToLabel } from "@app/pages/tasks/tasks-page";
import { SchemaDefinedField } from "@app/components/schema-defined-fields/SchemaDefinedFields";
import { useFetchApplicationManifest } from "@app/queries/applications";

export interface IApplicationDetailDrawerProps
  extends Pick<IPageDrawerContentProps, "onCloseClick"> {
  application: DecoratedApplication | null;
  onEditClick: () => void;
}

export enum TabKey {
  Details = 0,
  Tags,
  Reports,
  Facts,
  Reviews,
  Tasks,
  Manifest,
}

export const ApplicationDetailDrawer: React.FC<
  IApplicationDetailDrawerProps
> = ({ application, onCloseClick, onEditClick }) => {
  const { t } = useTranslation();

  const [activeTabKey, setActiveTabKey] = React.useState<TabKey>(
    TabKey.Details
  );

  const manifest = useFetchApplicationManifest(application?.id).manifest;

  return (
    <PageDrawerContent
      isExpanded={!!application}
      onCloseClick={onCloseClick}
      focusKey={application?.id}
      pageKey="app-inventory"
      header={
        <TextContent>
          <Text component="small" className={spacing.mb_0}>
            {t("terms.name")}
          </Text>
          <Title headingLevel="h2" size="lg" className={spacing.mtXs}>
            {application?.name}
          </Title>
        </TextContent>
      }
    >
      <div>
        {/* this div is required so the tabs are visible */}
        <Tabs
          activeKey={activeTabKey}
          onSelect={(_event, tabKey) => setActiveTabKey(tabKey as TabKey)}
          className={spacing.mtLg}
        >
          {!application ? null : (
            <Tab
              eventKey={TabKey.Details}
              title={<TabTitleText>{t("terms.details")}</TabTitleText>}
            >
              <TabDetailsContent
                application={application}
                onCloseClick={onCloseClick}
                onEditClick={onEditClick}
              />
            </Tab>
          )}

          {!application ? null : (
            <Tab
              eventKey={TabKey.Tags}
              title={<TabTitleText>Tags</TabTitleText>}
            >
              <TabTagsContent application={application} />
            </Tab>
          )}

          {!application ? null : (
            <Tab
              eventKey={TabKey.Reports}
              title={<TabTitleText>{t("terms.reports")}</TabTitleText>}
            >
              <TabReportsContent application={application} />
            </Tab>
          )}

          {!application ? null : (
            <Tab
              eventKey={TabKey.Reviews}
              title={<TabTitleText>{t("terms.review")}</TabTitleText>}
            >
              <ReviewFields application={application} />
            </Tab>
          )}
          {!application ? null : (
            <Tab
              eventKey={TabKey.Tasks}
              title={<TabTitleText>{t("terms.tasks")}</TabTitleText>}
            >
              <TabTasksContent application={application} />
            </Tab>
          )}
          {!application || !manifest ? null : (
            <Tab
              eventKey={TabKey.Manifest}
              title={<TabTitleText>{t("terms.manifest")}</TabTitleText>}
            >
              <TabManifestContent manifest={manifest} />
            </Tab>
          )}
        </Tabs>
      </div>
    </PageDrawerContent>
  );
};

const ApplicationArchetypesLabels: React.FC<{
  application: DecoratedApplication;
  filter?: (archetype: Archetype) => boolean;
  color?: Parameters<typeof LabelsFromItems>[0]["color"];
}> = ({
  application: {
    direct: { archetypes },
  },
  filter = () => true,
  color = "grey",
}) => {
  const { t } = useTranslation();
  const filteredArchetypes = !archetypes ? [] : archetypes.filter(filter);
  return (filteredArchetypes?.length ?? 0) > 0 ? (
    <LabelsFromItems items={filteredArchetypes} color={color} />
  ) : (
    <EmptyTextMessage message={t("terms.none")} />
  );
};

const TabDetailsContent: React.FC<{
  application: DecoratedApplication;
  onCloseClick: () => void;
  onEditClick: () => void;
}> = ({ application, onCloseClick, onEditClick }) => {

  const { assessments } = useFetchAssessments();

  const { archetypesById } = useFetchArchetypes();
  const reviewedArchetypes = !application?.archetypes
    ? []
    : application.archetypes
        .map((archetypeRef) => archetypesById[archetypeRef.id])
        .filter((fullArchetype) => fullArchetype?.review)
        .filter(Boolean);

  const issueReportsQuery = useFetchIssueReports(application.id);
  const {
    result: { data, total: totalReportCount },
  } = issueReportsQuery;
  const currentPageReports = data;
  const [minor, critical] = fork(currentPageReports, (u) => u.effort <= 1).map(
    (a) => a.length
  );

  const taskState = application.tasks.currentAnalyzer?.state ?? "";
  const taskSucceeded = TaskStates.Success.includes(taskState);

  return (
    <>
      <TextContent className={`${spacing.mtMd} ${spacing.mbMd}`}>
        <Text component="small">{application?.description}</Text>

        <List isPlain>
          {application ? (
            <>
              <ListItem>
                <Link to={getIssuesSingleAppSelectedLocation(application.id)}>
                  Issues
                </Link>
                <Text component="small">
                  {!taskSucceeded
                    ? t("terms.unassigned")
                    : currentPageReports.length === 0
                    ? t("issues.noIssues")
                    : t("issues.issuesFound", {
                        minor: minor,
                        critical: critical,
                      })}
                </Text>
              </ListItem>
              <ListItem>
                <Link
                  to={getDependenciesUrlFilteredByAppName(application?.name)}
                >
                  Dependencies
                </Link>
              </ListItem>
            </>
          ) : null}
        </List>

        <Title headingLevel="h3" size="md">
          {t("terms.effort")}
        </Title>
        <Text component="small">
          <Text component="small">
            {application?.effort !== 0 && application?.effort !== undefined
              ? application?.effort
              : t("terms.unassigned")}
          </Text>
        </Text>
      </TextContent>

      <Title headingLevel="h3" size="md">
        {t("terms.archetypes")}
      </Title>
      <DescriptionList
        isHorizontal
        isCompact
        columnModifier={{ default: "1Col" }}
        horizontalTermWidthModifier={{
          default: "15ch",
        }}
      >
        <DescriptionListGroup>
          <DescriptionListTerm>
            {t("terms.associatedArchetypes")}
          </DescriptionListTerm>
          <DescriptionListDescription>
            <ApplicationArchetypesLabels application={application} />
          </DescriptionListDescription>
        </DescriptionListGroup>

        <DescriptionListGroup>
          <DescriptionListTerm>
            {t("terms.archetypesAssessed")}
          </DescriptionListTerm>
          <DescriptionListDescription>
            <ApplicationArchetypesLabels
              application={application}
              filter={
                // Filter matches the archetype table's assessment column
                (archetype) => !!archetype.assessed
              }
            />
          </DescriptionListDescription>
        </DescriptionListGroup>

        <DescriptionListGroup>
          <DescriptionListTerm>
            {t("terms.archetypesReviewed")}
          </DescriptionListTerm>
          <DescriptionListDescription>
            <ApplicationArchetypesLabels
              application={application}
              filter={
                // Filter matches the archetype table's review column
                (archetype) => !!archetype.review
              }
            />
          </DescriptionListDescription>
        </DescriptionListGroup>
      </DescriptionList>

      <TextContent className={spacing.mtLg}>
        <Title headingLevel="h3" size="md">
          {t("terms.riskFromApplication")}
        </Title>
        <Text component="small" cy-data="comments">
          <RiskLabel risk={application?.risk} />
        </Text>
      </TextContent>

      <ApplicationDetailFields
        application={application}
        onEditClick={onEditClick}
        onCloseClick={onCloseClick}
      />
    </>
  );
};

const TabTagsContent: React.FC<{
  application: DecoratedApplication;
}> = ({ application }) => {
  const { t } = useTranslation();
  const task = application.tasks.currentAnalyzer;
  const isTaskRunning = task?.state === "Running";

  return (
    <>
      {isTaskRunning ? (
        <Bullseye className={spacing.mtLg}>
          <TextContent>
            <Text component={TextVariants.h3}>
              {t("message.taskInProgressForTags")}
              <Spinner
                isInline
                aria-label="spinner when a new analysis is running"
              />
            </Text>
          </TextContent>
        </Bullseye>
      ) : null}

      <ApplicationTags application={application} />
    </>
  );
};

const TabReportsContent: React.FC<{
  application: DecoratedApplication;
}> = ({ application }) => {
  const { t } = useTranslation();
  const { facts, isFetching } = useFetchFacts(application?.id);

  const { identities } = useFetchIdentities();
  let matchingSourceCredsRef: Identity | undefined;
  let matchingMavenCredsRef: Identity | undefined;
  if (application && identities) {
    matchingSourceCredsRef = getKindIdByRef(identities, application, "source");
    matchingMavenCredsRef = getKindIdByRef(identities, application, "maven");
  }

  const task = application.tasks.currentAnalyzer;
  const taskState = task?.state ?? "";
  const taskSucceeded = TaskStates.Success.includes(taskState);
  const taskFailed = TaskStates.Failed.includes(taskState);

  const notAvailable = <EmptyTextMessage message={t("terms.notAvailable")} />;

  const enableDownloadSetting = useSetting("download.html.enabled");

  const history = useHistory();
  const navigateToAnalysisDetails = () =>
    application?.id &&
    task?.id &&
    history.push(
      formatPath(Paths.applicationsAnalysisDetails, {
        applicationId: application?.id,
        taskId: task?.id,
      })
    );

  return (
    <>
      <TextContent className={spacing.mtMd}>
        <Title headingLevel="h3" size="md">
          Credentials
        </Title>
        {matchingSourceCredsRef && matchingMavenCredsRef ? (
          <Text component="small">
            <CheckCircleIcon color="green" />
            <span className={spacing.mlSm}>Source and Maven</span>
          </Text>
        ) : matchingMavenCredsRef ? (
          <Text component="small">
            <CheckCircleIcon color="green" />
            <span className={spacing.mlSm}>Maven</span>
          </Text>
        ) : matchingSourceCredsRef ? (
          <Text component="small">
            <CheckCircleIcon color="green" />
            <span className={spacing.mlSm}>Source</span>
          </Text>
        ) : (
          notAvailable
        )}

        <Title headingLevel="h3" size="md">
          Analysis
        </Title>
        {taskSucceeded ? (
          <>
            <DescriptionList isHorizontal columnModifier={{ default: "2Col" }}>
              <DescriptionListGroup>
                <DescriptionListTerm>Details</DescriptionListTerm>
                <DescriptionListDescription>
                  <Tooltip content="View the analysis task details">
                    <Button
                      icon={
                        <span className={spacing.mrXs}>
                          <ExclamationCircleIcon
                            color={COLOR_HEX_VALUES_BY_NAME.blue}
                          ></ExclamationCircleIcon>
                        </span>
                      }
                      type="button"
                      variant="link"
                      onClick={navigateToAnalysisDetails}
                      className={spacing.ml_0}
                      style={{ margin: "0", padding: "0" }}
                    >
                      View analysis details
                    </Button>
                  </Tooltip>
                </DescriptionListDescription>

                <DescriptionListTerm>Download</DescriptionListTerm>
                <DescriptionListDescription>
                  <Tooltip
                    content={
                      enableDownloadSetting.data
                        ? "Click to download TAR file with HTML static analysis report"
                        : "Download TAR file with HTML static analysis report is disabled by administrator"
                    }
                    position="top"
                  >
                    <DownloadButton
                      application={application}
                      mimeType={MimeType.TAR}
                      isDownloadEnabled={enableDownloadSetting.data}
                    >
                      HTML
                    </DownloadButton>
                  </Tooltip>
                  {" | "}
                  <Tooltip
                    content={
                      enableDownloadSetting.data
                        ? "Click to download YAML file with static analysis report"
                        : "Download YAML file with static analysis report is disabled by administrator"
                    }
                    position="top"
                  >
                    <DownloadButton
                      application={application}
                      mimeType={MimeType.YAML}
                      isDownloadEnabled={enableDownloadSetting.data}
                    >
                      YAML
                    </DownloadButton>
                  </Tooltip>
                </DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
            <Divider className={spacing.mtMd}></Divider>
          </>
        ) : taskFailed ? (
          task ? (
            <>
              <Button
                icon={
                  <span className={spacing.mrXs}>
                    <ExclamationCircleIcon
                      color={COLOR_HEX_VALUES_BY_NAME.red}
                    ></ExclamationCircleIcon>
                  </span>
                }
                type="button"
                variant="link"
                onClick={navigateToAnalysisDetails}
                className={spacing.ml_0}
                style={{ margin: "0", padding: "0" }}
              >
                Analysis details
              </Button>
            </>
          ) : (
            <span className={spacing.mlSm}>
              <ExclamationCircleIcon
                color={COLOR_HEX_VALUES_BY_NAME.red}
              ></ExclamationCircleIcon>
              Failed
            </span>
          )
        ) : (
          <>
            {task ? (
              <Button
                icon={
                  <span className={spacing.mrXs}>
                    <ExclamationCircleIcon
                      color={COLOR_HEX_VALUES_BY_NAME.blue}
                    ></ExclamationCircleIcon>
                  </span>
                }
                type="button"
                variant="link"
                onClick={navigateToAnalysisDetails}
                className={spacing.ml_0}
                style={{ margin: "0", padding: "0" }}
              >
                Analysis details
              </Button>
            ) : (
              notAvailable
            )}
          </>
        )}
      </TextContent>

      {!isFetching && !!facts.length && <ApplicationFacts facts={facts} />}
    </>
  );
};

const TabTasksContent: React.FC<{
  application: DecoratedApplication;
}> = ({ application }) => {
  const { t } = useTranslation();
  const history = useHistory();
  const urlParams = new URLSearchParams(window.location.search);
  const filters = urlParams.get("filters");
  const deserializedFilterValues = deserializeFilterUrlParams({ filters });
  const tableControlState = useTableControlState({
    tableName: "tasks-apps-table",
    persistTo: "urlParams",
    persistenceKeyPrefix: TablePersistenceKeyPrefix.tasks,
    columnNames: {
      taskId: "Task ID",
      taskKind: "Task Kind",
      status: "Status",
    },
    isFilterEnabled: true,
    isSortEnabled: true,
    isPaginationEnabled: true,
    sortableColumns: ["taskId", "taskKind", "status"],
    initialSort: { columnKey: "taskId", direction: "asc" },
    initialFilterValues: deserializedFilterValues,
    filterCategories: [
      {
        categoryKey: "id",
        title: "ID",
        type: FilterType.numsearch,
        placeholderText: t("actions.filterBy", {
          what: "ID...",
        }),
        getServerFilterValue: (value) => {
          console.log("this id:", value);
          return value ? value : [];
        },
      },
      {
        categoryKey: "kind",
        title: t("terms.kind"),
        type: FilterType.search,
        placeholderText: t("actions.filterBy", {
          what: t("terms.kind") + "...",
        }),
        getServerFilterValue: (value) => (value ? [`*${value[0]}*`] : []),
      },
      {
        categoryKey: "state",
        title: t("terms.status"),
        type: FilterType.search,
        placeholderText: t("actions.filterBy", {
          what: t("terms.status") + "...",
        }),
        getServerFilterValue: (value) => (value ? [`*${value[0]}*`] : []),
      },
    ],
    initialItemsPerPage: 10,
  });

  const {
    result: { data: currentPageItems = [], total: totalItemCount },
    isFetching,
    fetchError,
  } = useServerTasks(
    getHubRequestParams({
      ...tableControlState,
      hubSortFieldKeys: {
        taskId: "id",
        taskKind: "kind",
        status: "status",
      },
      implicitFilters: [
        {
          field: "application.id",
          operator: "=",
          value: application.id,
        },
      ],
    }),
    5000
  );
  const tableControls = useTableControlProps({
    ...tableControlState,
    idProperty: "id",
    currentPageItems: currentPageItems,
    totalItemCount,
    isLoading: isFetching,
    variant: "compact",
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
    },
  } = tableControls;

  const clearFilters = () => {
    const currentPath = history.location.pathname;
    const newSearch = new URLSearchParams(history.location.search);
    newSearch.delete("filters");
    history.push(`${currentPath}`);
  };
  return (
    <>
      <Toolbar
        {...toolbarProps}
        className={spacing.mtSm}
        clearAllFilters={clearFilters}
      >
        <ToolbarContent>
          <FilterToolbar {...filterToolbarProps} />
          <ToolbarItem {...paginationToolbarItemProps}>
            <SimplePagination
              idPrefix="task-apps-table"
              isTop
              isCompact
              paginationProps={paginationProps}
            />
          </ToolbarItem>
        </ToolbarContent>
      </Toolbar>
      <Table {...tableProps} aria-label="task applications table">
        <Thead>
          <Tr>
            <TableHeaderContentWithControls {...tableControls}>
              <Th {...getThProps({ columnKey: "taskId" })} />
              <Th
                {...getThProps({ columnKey: "taskKind" })}
                modifier="nowrap"
              />
              <Th {...getThProps({ columnKey: "status" })} modifier="nowrap" />
              <Th screenReaderText="row actions" />
            </TableHeaderContentWithControls>
          </Tr>
        </Thead>

        <ConditionalTableBody
          isLoading={isFetching}
          isError={!!fetchError}
          isNoData={totalItemCount === 0}
          numRenderedColumns={numRenderedColumns}
        >
          <Tbody>
            {currentPageItems?.map((task, rowIndex) => (
              <Tr key={task.id} {...getTrProps({ item: task })}>
                <TableRowContentWithControls
                  {...tableControls}
                  item={task}
                  rowIndex={rowIndex}
                >
                  <Td {...getTdProps({ columnKey: "taskId" })}>{task.id}</Td>
                  <Td {...getTdProps({ columnKey: "taskKind" })}>
                    {task.kind}
                  </Td>
                  <Td {...getTdProps({ columnKey: "status" })}>
                    <IconWithLabel
                      icon={<TaskStateIcon state={task.state} />}
                      label={
                        <Link
                          to={formatPath(Paths.applicationsTaskDetails, {
                            applicationId: application.id,
                            taskId: task.id,
                          })}
                        >
                          {t(taskStateToLabel[task.state ?? "No task"])}
                        </Link>
                      }
                    />
                  </Td>
                  <Td
                    key={`row-actions-${task.id}`}
                    isActionCell
                    id={`row-actions-${task.id}`}
                  >
                    <TaskActionColumn task={task} />
                  </Td>
                </TableRowContentWithControls>
              </Tr>
            ))}
          </Tbody>
        </ConditionalTableBody>
      </Table>
      <SimplePagination
        idPrefix="task-apps-table"
        isTop={false}
        isCompact
        paginationProps={paginationProps}
      />
    </>
  );
};

const TabManifestContent: React.FC<{
  manifest: Manifest;
}> = ({ manifest }) => {
  return (
    <SchemaDefinedField
      className={spacing.mtLg}
      baseJsonDocument={manifest}
      isReadOnly
    />
  );
};
