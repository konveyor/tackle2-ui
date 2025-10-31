import * as React from "react";
import { Link } from "react-router-dom";
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
import { Application, Identity, Task, MimeType, Ref } from "@app/api/models";
import {
  IPageDrawerContentProps,
  PageDrawerContent,
} from "@app/components/PageDrawerContext";
import {
  getDependenciesUrlFilteredByAppName,
  getIssuesSingleAppSelectedLocation,
} from "@app/pages/issues/helpers";
import { ApplicationTags } from "../application-tags";
import { COLOR_HEX_VALUES_BY_NAME } from "@app/Constants";
import { getTaskById } from "@app/api/rest";
import { EmptyTextMessage } from "@app/components/EmptyTextMessage";
import { SimpleDocumentViewerModal } from "@app/components/SimpleDocumentViewer";
import { useFetchFacts } from "@app/queries/facts";
import { useFetchIdentities } from "@app/queries/identities";
import { useSetting } from "@app/queries/settings";
import { getKindIdByRef } from "@app/utils/model-utils";
import DownloadButton from "./components/download-button";
import CheckCircleIcon from "@patternfly/react-icons/dist/esm/icons/check-circle-icon";
import ExclamationCircleIcon from "@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon";
import { ApplicationFacts } from "./application-facts";
import { ReviewFields } from "./review-fields";
import { LabelsFromItems } from "@app/components/labels/labels-from-items/labels-from-items";
import { ReviewedArchetypeItem } from "./reviewed-archetype-item";
import { RiskLabel } from "@app/components/RiskLabel";
import { ApplicationDetailFields } from "./application-detail-fields";

export interface IApplicationDetailDrawerProps
  extends Pick<IPageDrawerContentProps, "onCloseClick"> {
  application: Application | null;
  task: Task | undefined | null;
  applications?: Application[];
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
> = ({ onCloseClick, application, task, onEditClick }) => {
  const { t } = useTranslation();
  const [activeTabKey, setActiveTabKey] = React.useState<TabKey>(
    TabKey.Details
  );

  const isTaskRunning = task?.state === "Running";

  const { identities } = useFetchIdentities();
  const { facts, isFetching } = useFetchFacts(application?.id);
  const [taskIdToView, setTaskIdToView] = React.useState<number>();

  let matchingSourceCredsRef: Identity | undefined;
  let matchingMavenCredsRef: Identity | undefined;
  if (application && identities) {
    matchingSourceCredsRef = getKindIdByRef(identities, application, "source");
    matchingMavenCredsRef = getKindIdByRef(identities, application, "maven");
  }

  const notAvailable = <EmptyTextMessage message={t("terms.notAvailable")} />;

  const enableDownloadSetting = useSetting("download.html.enabled");

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
        <Tabs
          activeKey={activeTabKey}
          onSelect={(_event, tabKey) => setActiveTabKey(tabKey as TabKey)}
          className={spacing.mtLg}
        >
          <Tab
            eventKey={TabKey.Details}
            title={<TabTitleText>{t("terms.details")}</TabTitleText>}
          >
            <TextContent className={`${spacing.mtMd} ${spacing.mbMd}`}>
              <Text component="small">{application?.description}</Text>
              <List isPlain>
                {application ? (
                  <>
                    <ListItem>
                      <Link
                        to={getIssuesSingleAppSelectedLocation(application.id)}
                      >
                        Issues
                      </Link>
                    </ListItem>
                    <ListItem>
                      <Link
                        to={getDependenciesUrlFilteredByAppName(
                          application?.name
                        )}
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
                  {application?.effort !== 0 &&
                  application?.effort !== undefined
                    ? application?.effort
                    : t("terms.unassigned")}
                </Text>
              </Text>
            </TextContent>
            <>
              <Title headingLevel="h3" size="md">
                {t("terms.archetypes")}
              </Title>
              <DescriptionList
                isHorizontal
                isCompact
                columnModifier={{ default: "1Col" }}
                horizontalTermWidthModifier={{
                  default: "14ch",
                }}
              >
                <DescriptionListGroup>
                  <DescriptionListTerm>
                    {t("terms.associatedArchetypes")}
                  </DescriptionListTerm>
                  <DescriptionListDescription>
                    {application?.archetypes?.length ?? 0 > 0 ? (
                      <ArchetypeLabels
                        archetypeRefs={application?.archetypes}
                      />
                    ) : (
                      <EmptyTextMessage message={t("terms.none")} />
                    )}
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>
                    {t("terms.archetypesReviewed")}
                  </DescriptionListTerm>
                  <DescriptionListDescription>
                    {application?.archetypes?.length ?? 0 > 0 ? (
                      application?.archetypes?.map((archetypeRef) => (
                        <ReviewedArchetypeItem
                          key={archetypeRef.id}
                          id={archetypeRef.id}
                        />
                      ))
                    ) : (
                      <EmptyTextMessage message={t("terms.none")} />
                    )}
                  </DescriptionListDescription>
                </DescriptionListGroup>
              </DescriptionList>
              <TextContent className={spacing.mtLg}>
                <Title headingLevel="h3" size="md">
                  {t("terms.riskFromApplication")}
                </Title>
                <Text component="small" cy-data="comments">
                  <RiskLabel risk={application?.risk || "unknown"} />
                </Text>
              </TextContent>
              <ApplicationDetailFields
                application={application}
                onEditClick={onEditClick}
                onCloseClick={onCloseClick}
              />
            </>
          </Tab>

          <Tab eventKey={TabKey.Tags} title={<TabTitleText>Tags</TabTitleText>}>
            {application && isTaskRunning ? (
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

            {application ? <ApplicationTags application={application} /> : null}
          </Tab>

          <Tab
            eventKey={TabKey.Reports}
            title={<TabTitleText>{t("terms.reports")}</TabTitleText>}
          >
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
              {task?.state === "Succeeded" && application ? (
                <>
                  <DescriptionList
                    isHorizontal
                    columnModifier={{ default: "2Col" }}
                  >
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
                            onClick={() => setTaskIdToView(task.id)}
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
              ) : task?.state === "Failed" ? (
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
                      onClick={() => setTaskIdToView(task.id)}
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
                      onClick={() => setTaskIdToView(task?.id)}
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
              <SimpleDocumentViewerModal<Task | string>
                title={`Analysis details for ${application?.name}`}
                fetch={getTaskById}
                documentId={taskIdToView}
                onClose={() => {
                  setTaskIdToView(undefined);
                }}
              />
            </TextContent>
            {!isFetching && !!facts.length && (
              <ApplicationFacts facts={facts} />
            )}
          </Tab>
          <Tab
            eventKey={TabKey.Reviews}
            title={<TabTitleText>{t("terms.reviews")}</TabTitleText>}
          >
            <ReviewFields application={application} />
          </Tab>
        </Tabs>
      </div>
    </PageDrawerContent>
  );
};
const ArchetypeLabels: React.FC<{ archetypeRefs?: Ref[] }> = ({
  archetypeRefs,
}) => <LabelsFromItems items={archetypeRefs} />;
