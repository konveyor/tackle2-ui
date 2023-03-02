import * as React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  TextContent,
  Text,
  Title,
  Tooltip,
  Button,
} from "@patternfly/react-core";
import { OkIcon, ExclamationCircleIcon } from "@patternfly/react-icons";
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
  task?: Task;
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

  return (
    <ApplicationDetailDrawer
      application={application}
      onCloseClick={onCloseClick}
      detailsTabMainContent={
        <>
          <DescriptionList
            isHorizontal
            isCompact
            columnModifier={{ default: "1Col" }}
          >
            <DescriptionListGroup>
              <DescriptionListTerm>
                {t("terms.credentials")}
              </DescriptionListTerm>
              <DescriptionListDescription cy-data="credentials">
                {matchingSourceCredsRef && matchingMavenCredsRef ? (
                  <>
                    <OkIcon color="green"></OkIcon>
                    <span className={spacing.mlSm}>(Source and Maven)</span>
                  </>
                ) : matchingMavenCredsRef ? (
                  <>
                    <OkIcon color="green"></OkIcon>
                    <span className={spacing.mlSm}>(Maven)</span>
                  </>
                ) : matchingSourceCredsRef ? (
                  <>
                    <OkIcon color="green"></OkIcon>
                    <span className={spacing.mlSm}>(Source)</span>
                  </>
                ) : (
                  "Not available"
                )}
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>{t("terms.analysis")}</DescriptionListTerm>
              <DescriptionListDescription cy-data="analysis">
                {task?.state === "Succeeded" && application ? (
                  <Tooltip content="Click to view Analysis report">
                    <Button variant="link" isInline>
                      <Link
                        to={`/hub/applications/${application.id}/bucket${task?.data?.output}`}
                        target="_blank"
                      >
                        Report
                      </Link>
                    </Button>
                  </Tooltip>
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
                  "Not available"
                )}
              </DescriptionListDescription>
            </DescriptionListGroup>
          </DescriptionList>
          <TextContent className={spacing.mtLg}>
            <Title headingLevel="h3" size="md">
              {t("terms.comments")}
            </Title>
            <Text component="small" cy-data="comments">
              {application?.comments || (
                // TODO i18n here
                <EmptyTextMessage message="No comments" />
              )}
            </Text>
          </TextContent>
        </>
      }
      showReportsTab
    />
  );
};
