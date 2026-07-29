import React from "react";
import { AxiosError } from "axios";
import { Trans, useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import {
  Alert,
  Bullseye,
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  PageSection,
  ProgressStep,
  ProgressStepper,
  Spinner,
} from "@patternfly/react-core";

import type { PlaybookRunDetailsRoute } from "@app/Paths";
import { DevPaths } from "@app/Paths";
import type { AgentRunPhase } from "@app/api/agentic/contract";
import { isTerminalPhase, runHubCoordinates } from "@app/api/agentic/contract";
import { PageHeader } from "@app/components/PageHeader";
import { StateError } from "@app/components/StateError";
import { BranchPanel } from "@app/pages/agent-runs/components/BranchPanel";
import { PhaseLabel } from "@app/pages/agent-runs/components/PhaseLabel";
import { useFetchAgenticApplications } from "@app/queries/agentic-catalog";
import { useFetchPlaybookRun } from "@app/queries/playbook-runs";
import {
  formatAge,
  formatDuration,
  playbookRunDuration,
} from "@app/utils/agentic";
import { formatPath } from "@app/utils/utils";

/**
 * Map a stage phase to a ProgressStepper variant. Ready=False on the run
 * while a stage executes is the normal healthy state — only Failed is an
 * error here.
 */
function stepVariant(phase?: AgentRunPhase) {
  switch (phase) {
    case "Succeeded":
      return "success" as const;
    case "Failed":
      return "danger" as const;
    case "Running":
      return "info" as const;
    default:
      return "pending" as const;
  }
}

const PlaybookRunDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const { runName } = useParams<PlaybookRunDetailsRoute>();
  const { playbookRun, isLoading, fetchError } = useFetchPlaybookRun(runName);
  // Inventory failures leave `application` undefined — BranchPanel copes.
  const { applications } = useFetchAgenticApplications();

  const breadcrumbs = [
    { title: t("terms.playbookRuns"), path: DevPaths.playbookRuns },
    { title: runName },
  ];

  if (isLoading && !playbookRun) {
    return (
      <PageSection>
        <Bullseye>
          <Spinner aria-label={t("agentic.playbookRuns.loadingRun")} />
        </Bullseye>
      </PageSection>
    );
  }

  if (!playbookRun) {
    const isNotFound =
      !fetchError ||
      (fetchError instanceof AxiosError && fetchError.response?.status === 404);
    return (
      <>
        <PageSection hasBodyWrapper={false}>
          <PageHeader title={runName} breadcrumbs={breadcrumbs} />
        </PageSection>
        <PageSection>
          {isNotFound ? (
            <Alert
              variant="warning"
              isInline
              title={t("agentic.playbookRuns.notFoundTitle")}
            >
              <Trans
                i18nKey="agentic.playbookRuns.notFoundBody"
                values={{ name: runName }}
              />
            </Alert>
          ) : (
            <StateError />
          )}
        </PageSection>
      </>
    );
  }

  const stages = playbookRun.status?.stages ?? [];
  const currentStage = playbookRun.status?.currentStage;
  const coordinates = runHubCoordinates(playbookRun.spec.env);
  const application = applications.find((a) => a.id === coordinates.appId);

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <PageHeader
          title={runName}
          breadcrumbs={breadcrumbs}
          description={<PhaseLabel phase={playbookRun.status?.phase} />}
        />
        {fetchError && (
          <Alert
            variant="warning"
            isInline
            title={t("agentic.playbookRuns.refreshErrorTitle")}
            style={{ marginTop: "0.5rem" }}
          >
            {fetchError instanceof Error
              ? fetchError.message
              : String(fetchError)}
          </Alert>
        )}
        <DescriptionList
          isHorizontal
          isCompact
          columnModifier={{ default: "2Col" }}
          style={{ marginTop: "1rem" }}
        >
          <DescriptionListGroup>
            <DescriptionListTerm>{t("terms.playbook")}</DescriptionListTerm>
            <DescriptionListDescription>
              {playbookRun.spec.playbookRef}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>
              {t("agentic.playbookRuns.currentStage")}
            </DescriptionListTerm>
            <DescriptionListDescription>
              {currentStage ?? "-"}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>{t("terms.age")}</DescriptionListTerm>
            <DescriptionListDescription>
              {formatAge(playbookRun.metadata.creationTimestamp)}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>{t("terms.duration")}</DescriptionListTerm>
            <DescriptionListDescription>
              {formatDuration(playbookRunDuration(playbookRun))}
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </PageSection>
      <PageSection>
        <Content>
          <Content component="h2">{t("terms.stages")}</Content>
        </Content>
        {stages.length === 0 ? (
          <Alert
            variant="info"
            isInline
            title={t("agentic.playbookRuns.noStageStatusTitle")}
          >
            {t("agentic.playbookRuns.noStageStatusBody")}
          </Alert>
        ) : (
          <ProgressStepper
            aria-label={t("agentic.playbookRuns.stagesAriaLabel")}
          >
            {stages.map((stage) => (
              <ProgressStep
                key={stage.name}
                variant={stepVariant(stage.phase)}
                isCurrent={stage.name === currentStage}
                id={`stage-${stage.name}`}
                titleId={`stage-${stage.name}-title`}
                aria-label={t("agentic.playbookRuns.stageAriaLabel", {
                  name: stage.name,
                  phase: stage.phase ?? t("taskState.Pending"),
                })}
                description={
                  stage.agentRunName ? (
                    <Link
                      to={formatPath(DevPaths.agentRunDetails, {
                        runName: stage.agentRunName,
                      })}
                    >
                      {stage.phase === "Running"
                        ? t("agentic.playbookRuns.openLiveRun")
                        : t("agentic.playbookRuns.openRun")}
                    </Link>
                  ) : (
                    (stage.phase ?? t("taskState.Pending"))
                  )
                }
              >
                {stage.name}
              </ProgressStep>
            ))}
          </ProgressStepper>
        )}

        {coordinates.targetBranch && (
          <BranchPanel
            application={application}
            targetBranch={coordinates.targetBranch}
            isTerminal={isTerminalPhase(playbookRun.status?.phase)}
          />
        )}
      </PageSection>
    </>
  );
};

export default PlaybookRunDetailPage;
