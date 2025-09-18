import React from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import {
  Button,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Divider,
  Text,
  TextContent,
  Title,
  Tooltip,
} from "@patternfly/react-core";
import CheckCircleIcon from "@patternfly/react-icons/dist/esm/icons/check-circle-icon";
import ExclamationCircleIcon from "@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import { COLOR_HEX_VALUES_BY_NAME } from "@app/Constants";
import { Paths } from "@app/Paths";
import { Identity, MimeType } from "@app/api/models";
import { EmptyTextMessage } from "@app/components/EmptyTextMessage";
import { useFetchFacts } from "@app/queries/facts";
import { useFetchIdentities } from "@app/queries/identities";
import { useSetting } from "@app/queries/settings";
import { TaskStates } from "@app/queries/tasks";
import { getKindIdByRef } from "@app/utils/model-utils";
import { formatPath } from "@app/utils/utils";

import { DecoratedApplication } from "../useDecoratedApplications";

import { ApplicationFacts } from "./application-facts";
import DownloadButton from "./components/download-button";

export const TabReportsContent: React.FC<{
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
