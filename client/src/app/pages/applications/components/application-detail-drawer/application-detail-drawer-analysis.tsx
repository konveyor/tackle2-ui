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
import textStyles from "@patternfly/react-styles/css/utilities/Text/text";
import { Identity, Task } from "@app/api/models";
import { getKindIDByRef } from "@app/utils/model-utils";
import { useFetchIdentities } from "@app/queries/identities";
import {
  ApplicationDetailDrawer,
  IApplicationDetailDrawerProps,
} from "./application-detail-drawer";
import { EmptyTextMessage } from "@app/shared/components";
import { useSetting } from "@app/queries/settings";
import { APPLICATIONS } from "@app/api/rest";

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

  const { data: isCSVDownloadEnabled } = useSetting("download.csv.enabled");
  const { data: isHTMLDownloadEnabled } = useSetting("download.html.enabled");

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

  const updatedApplication = applications?.find(
    (app) => app.id === application?.id
  );

  return (
    <ApplicationDetailDrawer
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
              {(isHTMLDownloadEnabled || isCSVDownloadEnabled) && (
                <Text
                  component="h4"
                  className={`${spacing.mtSm} ${spacing.mbSm} ${textStyles.fontSizeSm} ${textStyles.fontWeightLight}`}
                >
                  Download report:
                  {isHTMLDownloadEnabled && (
                    <Tooltip content="Click to download Analysis report">
                      <Button
                        id="download-html"
                        variant="link"
                        isInline
                        className={spacing.pXs}
                      >
                        <Link
                          to={`${APPLICATIONS}/${application.id}/bucket${task?.data?.output}?filter=`}
                          target="_blank"
                          download
                        >
                          HTML
                        </Link>
                      </Button>
                    </Tooltip>
                  )}
                  {isHTMLDownloadEnabled && isCSVDownloadEnabled && (
                    <span className={spacing.pXs}>|</span>
                  )}
                  {isCSVDownloadEnabled && (
                    <>
                      <Tooltip content="Click to download Analysis report">
                        <Button
                          id="download-csv"
                          variant="link"
                          isInline
                          className={spacing.pXs}
                        >
                          <Link
                            to={`${APPLICATIONS}/${application.id}/bucket${task?.data?.output}?filter=*.csv`}
                            target="_blank"
                            download
                          >
                            CSV
                          </Link>
                        </Button>
                      </Tooltip>
                    </>
                  )}
                </Text>
              )}
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
