import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  TextContent,
  Text,
  Title,
  Tooltip,
  Button,
  Divider,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
} from "@patternfly/react-core";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
} from "@patternfly/react-icons";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import { Identity, MimeType, Task } from "@app/api/models";
import { getKindIdByRef } from "@app/utils/model-utils";
import { useFetchIdentities } from "@app/queries/identities";
import {
  ApplicationDetailDrawer,
  IApplicationDetailDrawerProps,
} from "./application-detail-drawer";
import { EmptyTextMessage } from "@app/components/EmptyTextMessage";
import { useFetchFacts } from "@app/queries/facts";
import { ApplicationFacts } from "./application-facts";
import { SimpleDocumentViewerModal } from "@app/components/SimpleDocumentViewer";
import { getTaskById } from "@app/api/rest";
import { COLOR_HEX_VALUES_BY_NAME } from "@app/Constants";
import DownloadButton from "./components/download-button";
import { useSetting } from "@app/queries/settings";

export interface IApplicationDetailDrawerAnalysisProps
  extends Pick<
    IApplicationDetailDrawerProps,
    "application" | "applications" | "onCloseClick" | "onEditClick"
  > {
  task: Task | undefined | null;
}

export const ApplicationDetailDrawerAnalysis: React.FC<
  IApplicationDetailDrawerAnalysisProps
> = ({ application, applications, onCloseClick, task, onEditClick }) => {
  const { t } = useTranslation();

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

  const updatedApplication = applications?.find(
    (app) => app.id === application?.id
  );
  const enableDownloadSetting = useSetting("download.html.enabled");

  return (
    <ApplicationDetailDrawer
      task={task}
      application={updatedApplication || null}
      onCloseClick={onCloseClick}
      onEditClick={onEditClick}
      reportsTabContent={
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
      }
      factsTabContent={
        !isFetching && !!facts.length && <ApplicationFacts facts={facts} />
      }
    />
  );
};
