import React from "react";
import { useHistory, useParams } from "react-router-dom";
import {
  Alert,
  Bullseye,
  Button,
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Flex,
  FlexItem,
  PageSection,
  ProgressStep,
  ProgressStepper,
  Spinner,
} from "@patternfly/react-core";
import { ArrowLeftIcon } from "@patternfly/react-icons";

import type { PlaybookRunDetailRoute } from "@app/Paths";
import { DevPaths } from "@app/Paths";
import type { AgentRunPhase } from "@app/api/agentic/contract";
import { isTerminalPhase, runHubCoordinates } from "@app/api/agentic/contract";
import { BranchPanel } from "@app/pages/agent-runs/components/BranchPanel";
import { PhaseLabel } from "@app/pages/agent-runs/components/PhaseLabel";
import {
  useFetchAgenticApplications,
  useFetchPlaybookRun,
} from "@app/queries/agent-runs";

import { playbookRunDuration } from "./playbook-runs-page";

function formatAge(creationTimestamp?: string): string {
  if (!creationTimestamp) return "-";
  const ms = Date.now() - new Date(creationTimestamp).getTime();
  if (ms < 0) return "0s";
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function formatDuration(seconds?: number): string {
  if (seconds == null) return "-";
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

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
  const history = useHistory();
  const { runName } = useParams<PlaybookRunDetailRoute>();
  const { playbookRun, isLoading, fetchError } = useFetchPlaybookRun(runName);
  // Inventory failures leave `application` undefined — BranchPanel copes.
  const { applications } = useFetchAgenticApplications();

  const goBack = () => history.push(DevPaths.playbookRuns);
  const openAgentRun = (name: string) => {
    history.push(DevPaths.agentRunDetail.replace(":runName", name));
  };

  if (isLoading && !playbookRun) {
    return (
      <PageSection>
        <Bullseye>
          <Spinner aria-label="Loading playbook run" />
        </Bullseye>
      </PageSection>
    );
  }

  if (!playbookRun) {
    return (
      <PageSection>
        <Alert variant="warning" isInline title="Playbook run not found">
          The playbook run <strong>{runName}</strong> was not found. It may have
          been deleted.
        </Alert>
        <Button
          variant="link"
          icon={<ArrowLeftIcon />}
          onClick={goBack}
          style={{ marginTop: "1rem" }}
        >
          Back to playbook runs
        </Button>
      </PageSection>
    );
  }

  const stages = playbookRun.status?.stages ?? [];
  const currentStage = playbookRun.status?.currentStage;
  const coordinates = runHubCoordinates(playbookRun.spec.env);
  const application = applications.find((a) => a.id === coordinates.appId);

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Button
          variant="link"
          isInline
          icon={<ArrowLeftIcon />}
          onClick={goBack}
          style={{ marginBottom: "0.5rem" }}
        >
          Back to playbook runs
        </Button>
        <Flex alignItems={{ default: "alignItemsCenter" }}>
          <FlexItem>
            <Content>
              <Content component="h1">{runName}</Content>
            </Content>
          </FlexItem>
          <FlexItem>
            <PhaseLabel phase={playbookRun.status?.phase} />
          </FlexItem>
        </Flex>
        {fetchError && (
          <Alert
            variant="warning"
            isInline
            title="Refresh error"
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
            <DescriptionListTerm>Playbook</DescriptionListTerm>
            <DescriptionListDescription>
              {playbookRun.spec.playbookRef}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Current stage</DescriptionListTerm>
            <DescriptionListDescription>
              {currentStage ?? "-"}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Age</DescriptionListTerm>
            <DescriptionListDescription>
              {formatAge(playbookRun.metadata.creationTimestamp)}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Duration</DescriptionListTerm>
            <DescriptionListDescription>
              {formatDuration(playbookRunDuration(playbookRun))}
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </PageSection>
      <PageSection>
        <Content>
          <Content component="h2">Stages</Content>
        </Content>
        {stages.length === 0 ? (
          <Alert variant="info" isInline title="No stage status yet">
            The controller has not populated stage status — the playbook may not
            be Ready.
          </Alert>
        ) : (
          <ProgressStepper aria-label="Playbook stages">
            {stages.map((stage) => (
              <ProgressStep
                key={stage.name}
                variant={stepVariant(stage.phase)}
                isCurrent={stage.name === currentStage}
                id={`stage-${stage.name}`}
                titleId={`stage-${stage.name}-title`}
                aria-label={`stage ${stage.name}: ${stage.phase ?? "Pending"}`}
                description={
                  stage.agentRunName ? (
                    <Button
                      variant="link"
                      isInline
                      onClick={() => {
                        if (stage.agentRunName)
                          openAgentRun(stage.agentRunName);
                      }}
                    >
                      {stage.phase === "Running" ? "Open live run" : "Open run"}
                    </Button>
                  ) : (
                    (stage.phase ?? "Pending")
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
