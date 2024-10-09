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
  Label,
  LabelGroup,
} from "@patternfly/react-core";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import CheckCircleIcon from "@patternfly/react-icons/dist/esm/icons/check-circle-icon";
import ExclamationCircleIcon from "@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon";

import {
  Identity,
  MimeType,
  Ref,
  Archetype,
  TaskDashboard,
  AnalysisRuleReport,
  AnalysisIssueReport,
} from "@app/api/models";
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
import { AssessedArchetypes } from "./components/assessed-archetypes";
import DownloadButton from "./components/download-button";
import { ApplicationDetailFields } from "./application-detail-fields";
import { ApplicationFacts } from "./application-facts";
import { formatPath } from "@app/utils/utils";
import { Paths } from "@app/Paths";
import { useFetchArchetypes } from "@app/queries/archetypes";
import { useFetchAssessments } from "@app/queries/assessments";
import { DecoratedApplication } from "../../applications-table/useDecoratedApplications";
import { TaskStates, useFetchTaskByID } from "@app/queries/tasks";
import { useFetchIssueReports } from "@app/queries/issues";

export interface IApplicationDetailDrawerProps
  extends Pick<IPageDrawerContentProps, "onCloseClick"> {
  application: DecoratedApplication | null;
  task: TaskDashboard | null;
  onEditClick: () => void;
}

enum TabKey {
  Details = 0,
  Tags,
  Reports,
  Facts,
  Reviews,
}

export const ApplicationDetailDrawer: React.FC<
  IApplicationDetailDrawerProps
> = ({ application, task, onCloseClick, onEditClick }) => {
  const { t } = useTranslation();
  const [activeTabKey, setActiveTabKey] = React.useState<TabKey>(
    TabKey.Details
  );

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
              <TabTagsContent application={application} task={task} />
            </Tab>
          )}

          {!application ? null : (
            <Tab
              eventKey={TabKey.Reports}
              title={<TabTitleText>{t("terms.reports")}</TabTitleText>}
            >
              <TabReportsContent application={application} task={task} />
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
        </Tabs>
      </div>
    </PageDrawerContent>
  );
};
const ArchetypeLabels: React.FC<{ archetypeRefs?: Ref[] }> = ({
  archetypeRefs,
}) => <LabelsFromItems items={archetypeRefs} />;

const ArchetypeItem: React.FC<{ archetype: Archetype }> = ({ archetype }) => {
  return <Label color="grey">{archetype.name}</Label>;
};

const TabDetailsContent: React.FC<{
  application: DecoratedApplication;
  onCloseClick: () => void;
  onEditClick: () => void;
}> = ({ application, onCloseClick, onEditClick }) => {
  const { t } = useTranslation();

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
    isFetching: isFetchingReports,
    fetchError: reportsFetchError,
  } = issueReportsQuery;
  const currentPageReports = data as (
    | AnalysisRuleReport
    | AnalysisIssueReport
  )[];
  const minor = currentPageReports.filter((u) => u.effort === 1).length;
  const critical = currentPageReports.filter((u) => u.effort > 1).length;

  const { task, isFetching, fetchError, refetch } = useFetchTaskByID(
    application.tasks.currentAnalyzer?.id
  );
  const targets = task?.data?.rules?.labels?.included.filter((t) =>
    t.startsWith("konveyor.io/target=")
  );

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
                  {application.tasks.currentAnalyzer === undefined ||
                  application.tasks.currentAnalyzer.state === "Failed"
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
            {application?.archetypes?.length ? (
              <>
                <DescriptionListDescription>
                  {application.archetypes.length ?? 0 > 0 ? (
                    <ArchetypeLabels
                      archetypeRefs={application.archetypes as Ref[]}
                    />
                  ) : (
                    <EmptyTextMessage message={t("terms.none")} />
                  )}
                </DescriptionListDescription>
              </>
            ) : (
              <EmptyTextMessage message={t("terms.none")} />
            )}
          </DescriptionListDescription>
        </DescriptionListGroup>

        <DescriptionListGroup>
          <DescriptionListTerm>
            {t("terms.archetypesAssessed")}
          </DescriptionListTerm>
          {(assessments?.length ?? 0) > 0 ? (
            <DescriptionListDescription>
              <AssessedArchetypes
                application={application}
                assessments={assessments}
              />
            </DescriptionListDescription>
          ) : (
            <EmptyTextMessage message={t("terms.none")} />
          )}
        </DescriptionListGroup>

        <DescriptionListGroup>
          <DescriptionListTerm>
            {t("terms.archetypesReviewed")}
          </DescriptionListTerm>
          <DescriptionListDescription>
            <LabelGroup>
              {reviewedArchetypes?.length ? (
                reviewedArchetypes.map((reviewedArchetype) => (
                  <ArchetypeItem
                    key={reviewedArchetype?.id}
                    archetype={reviewedArchetype}
                  />
                ))
              ) : (
                <EmptyTextMessage message={t("terms.none")} />
              )}
            </LabelGroup>
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
      <TextContent className={spacing.mtLg}>
        <Title headingLevel="h3" size="md">
          Targets
        </Title>
        {targets?.map((t) => <Text component="small">{t}</Text>)}
      </TextContent>
    </>
  );
};

const TabTagsContent: React.FC<{
  application: DecoratedApplication;
  task: TaskDashboard | null;
}> = ({ application, task }) => {
  const { t } = useTranslation();
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
  task: TaskDashboard | null;
}> = ({ application, task }) => {
  const { t } = useTranslation();
  const { facts, isFetching } = useFetchFacts(application?.id);

  const { identities } = useFetchIdentities();
  let matchingSourceCredsRef: Identity | undefined;
  let matchingMavenCredsRef: Identity | undefined;
  if (application && identities) {
    matchingSourceCredsRef = getKindIdByRef(identities, application, "source");
    matchingMavenCredsRef = getKindIdByRef(identities, application, "maven");
  }

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

  const taskState = application.tasks.currentAnalyzer?.state ?? "";
  const taskSucceeded = TaskStates.Success.includes(taskState);
  const taskFailed = TaskStates.Failed.includes(taskState);

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
