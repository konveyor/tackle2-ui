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

import type { WorkloadRunDetailsRoute } from "@app/Paths";
import { DevPaths } from "@app/Paths";
import type { AgentRunPhase } from "@app/api/agentic/contract";
import { isTerminalPhase, runHubCoordinates } from "@app/api/agentic/contract";
import { PageHeader } from "@app/components/PageHeader";
import { StateError } from "@app/components/StateError";
import { BranchPanel } from "@app/pages/agent-runs/components/BranchPanel";
import { PhaseLabel } from "@app/pages/agent-runs/components/PhaseLabel";
import { useFetchAgenticApplications } from "@app/queries/agentic-catalog";
import { useFetchWorkloadRun } from "@app/queries/workload-runs";
import {
  formatAge,
  formatDuration,
  workloadRunDuration,
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

const WorkloadRunDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const { runName } = useParams<WorkloadRunDetailsRoute>();
  const { workloadRun, isLoading, fetchError } = useFetchWorkloadRun(runName);
  // Inventory failures leave `application` undefined — BranchPanel copes.
  const { applications } = useFetchAgenticApplications();

  const breadcrumbs = [
    { title: t("terms.workloadRuns"), path: DevPaths.workloadRuns },
    { title: runName },
  ];

  if (isLoading && !workloadRun) {
    return (
      <PageSection>
        <Bullseye>
          <Spinner aria-label={t("agentic.workloadRuns.loadingRun")} />
        </Bullseye>
      </PageSection>
    );
  }

  if (!workloadRun) {
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
              title={t("agentic.workloadRuns.notFoundTitle")}
            >
              <Trans
                i18nKey="agentic.workloadRuns.notFoundBody"
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

  const stages = workloadRun.status?.stages ?? [];
  const currentStage = workloadRun.status?.currentStage;
  const coordinates = runHubCoordinates(workloadRun.spec.env);
  const application = applications.find((a) => a.id === coordinates.appId);

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <PageHeader
          title={runName}
          breadcrumbs={breadcrumbs}
          description={<PhaseLabel phase={workloadRun.status?.phase} />}
        />
        {fetchError && (
          <Alert
            variant="warning"
            isInline
            title={t("agentic.workloadRuns.refreshErrorTitle")}
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
            <DescriptionListTerm>{t("terms.workload")}</DescriptionListTerm>
            <DescriptionListDescription>
              {workloadRun.spec.workloadRef}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>
              {t("agentic.workloadRuns.currentStage")}
            </DescriptionListTerm>
            <DescriptionListDescription>
              {currentStage ?? "-"}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>{t("terms.age")}</DescriptionListTerm>
            <DescriptionListDescription>
              {formatAge(workloadRun.metadata.creationTimestamp)}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>{t("terms.duration")}</DescriptionListTerm>
            <DescriptionListDescription>
              {formatDuration(workloadRunDuration(workloadRun))}
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
            title={t("agentic.workloadRuns.noStageStatusTitle")}
          >
            {t("agentic.workloadRuns.noStageStatusBody")}
          </Alert>
        ) : (
          <ProgressStepper
            aria-label={t("agentic.workloadRuns.stagesAriaLabel")}
          >
            {stages.map((stage) => (
              <ProgressStep
                key={stage.name}
                variant={stepVariant(stage.phase)}
                isCurrent={stage.name === currentStage}
                id={`stage-${stage.name}`}
                titleId={`stage-${stage.name}-title`}
                aria-label={t("agentic.workloadRuns.stageAriaLabel", {
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
                        ? t("agentic.workloadRuns.openLiveRun")
                        : t("agentic.workloadRuns.openRun")}
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
            isTerminal={isTerminalPhase(workloadRun.status?.phase)}
          />
        )}
      </PageSection>
    </>
  );
};

export default WorkloadRunDetailPage;
