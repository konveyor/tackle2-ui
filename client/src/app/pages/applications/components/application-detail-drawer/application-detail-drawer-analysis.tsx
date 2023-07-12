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
import { Fact, Identity, Task } from "@app/api/models";
import { getKindIDByRef } from "@app/utils/model-utils";
import { useFetchIdentities } from "@app/queries/identities";
import {
  ApplicationDetailDrawer,
  IApplicationDetailDrawerProps,
} from "./application-detail-drawer";
import { EmptyTextMessage } from "@app/shared/components";
import { useFetchFacts } from "@app/queries/facts";
import { ApplicationFacts } from "./application-facts";
import { SimpleDocumentViewerModal } from "@app/shared/components/simple-task-viewer";
import { getApplicationAnalysis, getTaskById } from "@app/api/rest";
import { COLOR_NAMES_BY_HEX_VALUE } from "@app/Constants";

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
              <Tooltip content="View Report">
                <Button
                  type="button"
                  variant="link"
                  isInline
                  onClick={() => setAppAnalysisToView(application.id)}
                >
                  View analysis
                </Button>
              </Tooltip>
            </>
          ) : task?.state === "Failed" ? (
            task ? (
              <>
                <Button
                  icon={
                    <span className={spacing.mrXs}>
                      <ExclamationCircleIcon
                        color={COLOR_NAMES_BY_HEX_VALUE.red}
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
                  color={COLOR_NAMES_BY_HEX_VALUE.red}
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
                        color={COLOR_NAMES_BY_HEX_VALUE.blue}
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
            onClose={() => setTaskIdToView(undefined)}
          />
        </TextContent>
      }
      factsTabContent={
        !isFetching && !!facts.length && <ApplicationFacts facts={facts} />
      }
    />
  );
};
