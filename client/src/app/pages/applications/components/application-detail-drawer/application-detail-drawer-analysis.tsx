import * as React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  TextContent,
  Text,
  Title,
  Tooltip,
  Button,
} from "@patternfly/react-core";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
} from "@patternfly/react-icons";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import { Identity, Task } from "@app/api/models";
import { getKindIDByRef } from "@app/utils/model-utils";
import { useFetchIdentities } from "@app/queries/identities";
import {
  ApplicationDetailDrawer,
  IApplicationDetailDrawerProps,
} from "./application-detail-drawer";
import { EmptyTextMessage } from "@app/shared/components";

export interface IApplicationDetailDrawerAnalysisProps
  extends Pick<IApplicationDetailDrawerProps, "application" | "onCloseClick"> {
  task: Task | undefined | null;
}

export const ApplicationDetailDrawerAnalysis: React.FC<
  IApplicationDetailDrawerAnalysisProps
> = ({ application, onCloseClick, task }) => {
  const { t } = useTranslation();

  const { identities } = useFetchIdentities();

  let matchingSourceCredsRef: Identity | undefined;
  let matchingMavenCredsRef: Identity | undefined;
  if (application && identities) {
    matchingSourceCredsRef = getKindIDByRef(identities, application, "source");
    matchingMavenCredsRef = getKindIDByRef(identities, application, "maven");
  }

  const openAnalysisDetails = () => {
    if (task) window.open(`/hub/tasks/${task.id}`, "_blank");
  };

  const notAvailable = <EmptyTextMessage message={t("terms.notAvailable")} />;

  return (
    <ApplicationDetailDrawer
      application={application}
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
              <Tooltip content="View Report">
                <Button variant="link" isInline>
                  <Link
                    to={`/hub/applications/${application.id}/bucket${task?.data?.output}`}
                    target="_blank"
                  >
                    Report
                  </Link>
                </Button>
              </Tooltip>
              {/* TODO(mturley) also add Download Report: HTML, CSV here */}
            </>
          ) : task?.state === "Failed" ? (
            <>
              {task ? (
                <Button
                  icon={
                    <span className={spacing.mrXs}>
                      <ExclamationCircleIcon color="#c9190b"></ExclamationCircleIcon>
                    </span>
                  }
                  type="button"
                  variant="link"
                  onClick={openAnalysisDetails}
                  className={spacing.ml_0}
                  style={{ margin: "0", padding: "0" }}
                >
                  Analysis details
                </Button>
              ) : (
                <span className={spacing.mlSm}>
                  <ExclamationCircleIcon color="#c9190b"></ExclamationCircleIcon>
                  Failed
                </span>
              )}
            </>
          ) : (
            notAvailable
          )}
        </TextContent>
      }
    />
  );
};
