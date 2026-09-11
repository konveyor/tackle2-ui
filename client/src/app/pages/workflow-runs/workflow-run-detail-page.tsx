import React, { useState } from "react";
import { AxiosError } from "axios";
import { Trans, useTranslation } from "react-i18next";
import { Link, useHistory, useParams } from "react-router-dom";
import {
  Alert,
  Bullseye,
  Button,
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
import { RedoIcon } from "@patternfly/react-icons";

import type { WorkflowRunDetailsRoute } from "@app/Paths";
import { DevPaths } from "@app/Paths";
import type {
  AgentRunPhase,
  AgentWorkflowRunStageStatus,
} from "@app/api/agentic/contract";
import { isTerminalPhase, runHubCoordinates } from "@app/api/agentic/contract";
import { useHasSomeScopes } from "@app/auth";
import { AgenticFetchError } from "@app/components/AgenticFetchError";
import { PageHeader } from "@app/components/PageHeader";
import { BranchPanel } from "@app/pages/agent-runs/components/BranchPanel";
import { ChatPanel } from "@app/pages/agent-runs/components/ChatPanel";
import { PhaseLabel } from "@app/pages/agent-runs/components/PhaseLabel";
import { RunConditionSummary } from "@app/pages/agent-runs/components/RunConditionSummary";
import { useFetchAgentRun } from "@app/queries/agent-runs";
import { useFetchApplications } from "@app/queries/applications";
import { useFetchWorkflowRun } from "@app/queries/workflow-runs";
import { agenticWorkflowRunsCreateScopes } from "@app/scopes";
import {
  formatAge,
  formatDuration,
  runBelongsToApplication,
  workflowRunDuration,
} from "@app/utils/agentic";
import { formatPath } from "@app/utils/utils";

import { CreateWorkflowRunModal } from "./components/CreateWorkflowRunModal";

import "@app/pages/agent-runs/agent-runs.css";

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

/** The child AgentRun whose ACP viewer belongs on the workflow page. */
function liveStageOf(
  stages: AgentWorkflowRunStageStatus[],
  currentStage?: string
): AgentWorkflowRunStageStatus | undefined {
  const current = stages.find((stage) => stage.name === currentStage);
  return current?.phase === "Running" && current.agentRunName
    ? current
    : stages.find((stage) => stage.phase === "Running" && !!stage.agentRunName);
}

const WorkflowRunDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const { runName } = useParams<WorkflowRunDetailsRoute>();
  const { workflowRun, isLoading, fetchError } = useFetchWorkflowRun(runName);
  const workflowFinished = isTerminalPhase(workflowRun?.status?.phase);
  const liveStage = workflowFinished
    ? undefined
    : liveStageOf(
        workflowRun?.status?.stages ?? [],
        workflowRun?.status?.currentStage
      );
  const liveRunName = liveStage?.agentRunName ?? "";
  const {
    agentRun: liveAgentRun,
    isLoading: liveRunLoading,
    fetchError: liveRunFetchError,
  } = useFetchAgentRun(liveRunName);
  // "Run again": the spec is immutable and the hub has no delete, so a
  // prefilled create is the one re-run shape there is.
  const canCreate = useHasSomeScopes(agenticWorkflowRunsCreateScopes);
  const [rerunOpen, setRerunOpen] = useState(false);
  // Inventory failures leave `application` undefined — BranchPanel copes.
  const { data: applications } = useFetchApplications();

  const breadcrumbs = [
    { title: t("terms.workflowRuns"), path: DevPaths.workflowRuns },
    { title: runName },
  ];

  if (isLoading && !workflowRun) {
    return (
      <PageSection>
        <Bullseye>
          <Spinner aria-label={t("agentic.workflowRuns.loadingRun")} />
        </Bullseye>
      </PageSection>
    );
  }

  if (!workflowRun) {
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
              title={t("agentic.workflowRuns.notFoundTitle")}
            >
              <Trans
                i18nKey="agentic.workflowRuns.notFoundBody"
                values={{ name: runName }}
              />
            </Alert>
          ) : (
            <AgenticFetchError error={fetchError} />
          )}
        </PageSection>
      </>
    );
  }

  const stages = workflowRun.status?.stages ?? [];
  const currentStage = workflowRun.status?.currentStage;
  const coordinates = runHubCoordinates(workflowRun.spec.env);
  const application = applications.find((a) =>
    runBelongsToApplication(workflowRun, a.id)
  );
  const finished = workflowFinished;

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <PageHeader
          title={runName}
          breadcrumbs={breadcrumbs}
          description={
            <span className="run-phase-line">
              <PhaseLabel phase={workflowRun.status?.phase} />
              <RunConditionSummary
                conditions={workflowRun.status?.conditions}
                phase={workflowRun.status?.phase}
              />
            </span>
          }
          btnActions={
            finished && canCreate ? (
              <Button
                variant="secondary"
                icon={<RedoIcon />}
                onClick={() => setRerunOpen(true)}
              >
                {t("actions.runAgain")}
              </Button>
            ) : undefined
          }
        />
        {fetchError && (
          <Alert
            variant="warning"
            isInline
            title={t("agentic.workflowRuns.refreshErrorTitle")}
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
            <DescriptionListTerm>{t("terms.workflow")}</DescriptionListTerm>
            <DescriptionListDescription>
              {workflowRun.spec.workflowRef}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>
              {t("agentic.workflowRuns.currentStage")}
            </DescriptionListTerm>
            <DescriptionListDescription>
              {currentStage ?? "-"}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>{t("terms.age")}</DescriptionListTerm>
            <DescriptionListDescription>
              {formatAge(workflowRun.metadata.creationTimestamp)}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>{t("terms.duration")}</DescriptionListTerm>
            <DescriptionListDescription>
              {formatDuration(workflowRunDuration(workflowRun))}
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
            title={t("agentic.workflowRuns.noStageStatusTitle")}
          >
            {t("agentic.workflowRuns.noStageStatusBody")}
          </Alert>
        ) : (
          <ProgressStepper
            aria-label={t("agentic.workflowRuns.stagesAriaLabel")}
          >
            {stages.map((stage) => (
              <ProgressStep
                key={stage.name}
                variant={stepVariant(stage.phase)}
                isCurrent={stage.name === currentStage}
                id={`stage-${stage.name}`}
                titleId={`stage-${stage.name}-title`}
                aria-label={t("agentic.workflowRuns.stageAriaLabel", {
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
                        ? t("agentic.workflowRuns.openLiveRun")
                        : t("agentic.workflowRuns.openRun")}
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
            isTerminal={finished}
          />
        )}
      </PageSection>
      {liveStage && (
        <PageSection
          isFilled
          hasBodyWrapper={false}
          className="run-detail-chat-section"
          padding={{ default: "padding" }}
        >
          <Alert
            variant="warning"
            isInline
            title={t("agentic.workflowRuns.approvalViewerTitle")}
            style={{ marginBottom: "1rem" }}
          >
            {t("agentic.workflowRuns.approvalViewerBody", {
              stage: liveStage.name,
            })}
          </Alert>
          {liveRunFetchError && !liveAgentRun && (
            <Alert
              variant="danger"
              isInline
              title={t("agentic.workflowRuns.liveStageLoadFailed")}
            >
              {liveRunFetchError instanceof Error
                ? liveRunFetchError.message
                : String(liveRunFetchError)}
            </Alert>
          )}
          {liveRunLoading && !liveAgentRun && (
            <Bullseye>
              <Spinner
                aria-label={t("agentic.workflowRuns.loadingLiveStage")}
              />
            </Bullseye>
          )}
          {liveAgentRun && (
            <ChatPanel
              key={liveRunName}
              runName={liveRunName}
              status={liveAgentRun.status}
              agentRef={liveAgentRun.spec.agentRef}
              targetBranch={coordinates.targetBranch}
            />
          )}
        </PageSection>
      )}
      {rerunOpen && (
        <CreateWorkflowRunModal
          prefill={workflowRun}
          onClose={() => setRerunOpen(false)}
          onCreated={(name) => {
            setRerunOpen(false);
            history.push(
              formatPath(DevPaths.workflowRunDetails, { runName: name })
            );
          }}
        />
      )}
    </>
  );
};

export default WorkflowRunDetailPage;
