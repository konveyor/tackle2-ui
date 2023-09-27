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
import { getKindIDByRef } from "@app/utils/model-utils";
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

export interface IApplicationDetailDrawerAnalysisProps
  extends Pick<
    IApplicationDetailDrawerProps,
    "application" | "applications" | "onCloseClick"
  > {
  task: Task | undefined | null;
}

export const ApplicationDetailDrawerAnalysis: React.FC<
  IApplicationDetailDrawerAnalysisProps
> = ({ application, applications, onCloseClick, task }) => {
  const { t } = useTranslation();

  const { identities } = useFetchIdentities();
  const { facts, isFetching } = useFetchFacts(application?.id);
  const [appAnalysisToView, setAppAnalysisToView] = React.useState<number>();
  const [taskIdToView, setTaskIdToView] = React.useState<number>();

  let matchingSourceCredsRef: Identity | undefined;
  let matchingMavenCredsRef: Identity | undefined;
  if (application && identities) {
    matchingSourceCredsRef = getKindIDByRef(identities, application, "source");
    matchingMavenCredsRef = getKindIDByRef(identities, application, "maven");
  }

  const notAvailable = <EmptyTextMessage message={t("terms.notAvailable")} />;

  const updatedApplication = applications?.find(
    (app) => app.id === application?.id
  );

  return (
    <ApplicationDetailDrawer
      task={task}
      application={updatedApplication || null}
      onCloseClick={onCloseClick}
      detailsTabMainContent={
        <TextContent className={spacing.mtLg}>
          <Title headingLevel="h3" size="md">
            {t("terms.comments")}
          </Title>
          <Text component="small" cy-data="comments">
            {application?.comments || notAvailable}
          </Text>
        </TextContent>
      }
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
                        onClick={() => setAppAnalysisToView(application.id)}
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
                      content="Click to download Analysis report TAR file"
                      position="top"
                    >
                      <DownloadButton
                        application={application}
                        mimeType={MimeType.TAR}
                      />
                    </Tooltip>
                    {" | "}
                    <Tooltip
                      content="Click to download Analysis report YAML file"
                      position="top"
                    >
                      <DownloadButton
                        application={application}
                        mimeType={MimeType.YAML}
                      />
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
            documentId={taskIdToView || appAnalysisToView}
            onClose={() => {
              setTaskIdToView(undefined);
              setAppAnalysisToView(undefined);
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
