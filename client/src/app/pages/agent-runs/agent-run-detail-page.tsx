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
  ExpandableSection,
  Flex,
  FlexItem,
  Label,
  PageSection,
  Spinner,
} from "@patternfly/react-core";
import { ArrowLeftIcon } from "@patternfly/react-icons";

import type { AgentRunDetailRoute } from "@app/Paths";
import { DevPaths } from "@app/Paths";
import { isTerminalPhase, runHubCoordinates } from "@app/api/agentic/contract";
import {
  useFetchAgentRun,
  useFetchAgenticApplications,
} from "@app/queries/agent-runs";

import { BranchPanel } from "./components/BranchPanel";
import { ChatPanel } from "./components/ChatPanel";
import { PhaseLabel } from "./components/PhaseLabel";

import "./agent-runs.css";

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

const AgentRunDetailPage: React.FC = () => {
  const history = useHistory();
  const { runName } = useParams<AgentRunDetailRoute>();
  const { agentRun, isLoading, fetchError } = useFetchAgentRun(runName, 2000);
  // Inventory failures leave `application` undefined — BranchPanel copes.
  const { applications } = useFetchAgenticApplications();

  const goBack = () => history.push(DevPaths.agentRuns);

  if (isLoading && !agentRun) {
    return (
      <PageSection>
        <Bullseye>
          <Spinner aria-label="Loading agent run" />
        </Bullseye>
      </PageSection>
    );
  }

  if (!agentRun) {
    return (
      <PageSection>
        <Alert variant="warning" isInline title="Agent run not found">
          The run <strong>{runName}</strong> was not found. It may have been
          deleted.
        </Alert>
        <Button
          variant="link"
          icon={<ArrowLeftIcon />}
          onClick={goBack}
          style={{ marginTop: "1rem" }}
        >
          Back to agent runs
        </Button>
      </PageSection>
    );
  }

  const coordinates = runHubCoordinates(agentRun.spec.env);
  const application = applications.find((a) => a.id === coordinates.appId);
  const instructions = agentRun.spec.instructions;
  const params = agentRun.spec.params ?? [];
  const models = agentRun.spec.models ?? [];

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
          Back to agent runs
        </Button>
        <Flex alignItems={{ default: "alignItemsCenter" }}>
          <FlexItem>
            <Content>
              <Content component="h1">{runName}</Content>
            </Content>
          </FlexItem>
          <FlexItem>
            <PhaseLabel phase={agentRun.status?.phase} />
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
            <DescriptionListTerm>Agent</DescriptionListTerm>
            <DescriptionListDescription>
              {agentRun.spec.agentRef}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Sandbox</DescriptionListTerm>
            <DescriptionListDescription>
              {agentRun.status?.sandboxName ?? "-"}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Age</DescriptionListTerm>
            <DescriptionListDescription>
              {formatAge(agentRun.metadata.creationTimestamp)}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Duration</DescriptionListTerm>
            <DescriptionListDescription>
              {formatDuration(agentRun.status?.duration)}
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>

        <Content>
          <Content component="h3" style={{ marginTop: "1rem" }}>
            Run spec
          </Content>
        </Content>
        <DescriptionList isHorizontal isCompact style={{ marginTop: "0.5rem" }}>
          <DescriptionListGroup>
            <DescriptionListTerm>Instructions</DescriptionListTerm>
            <DescriptionListDescription>
              {!instructions ? (
                "-"
              ) : instructions.length > 120 ? (
                <ExpandableSection toggleText="Instructions">
                  {instructions}
                </ExpandableSection>
              ) : (
                instructions
              )}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Params</DescriptionListTerm>
            <DescriptionListDescription>
              {params.length === 0
                ? "-"
                : params.map((p) => (
                    <Label
                      key={p.name}
                      isCompact
                      variant="outline"
                      style={{ marginRight: "0.5rem" }}
                    >
                      <code>
                        {p.name}={p.value}
                      </code>
                    </Label>
                  ))}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Models</DescriptionListTerm>
            <DescriptionListDescription>
              {models.length === 0
                ? "-"
                : models.map((m) => (
                    <div key={m.role}>
                      {m.role}: {m.provider} / {m.model}
                    </div>
                  ))}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Application id</DescriptionListTerm>
            <DescriptionListDescription>
              {coordinates.appId ?? "-"}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Hub base URL</DescriptionListTerm>
            <DescriptionListDescription>
              {coordinates.hubBaseUrl ? (
                <code>{coordinates.hubBaseUrl}</code>
              ) : (
                "-"
              )}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Hub token</DescriptionListTerm>
            <DescriptionListDescription>
              {coordinates.hasToken ? "(set)" : "-"}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Target branch</DescriptionListTerm>
            <DescriptionListDescription>
              {coordinates.targetBranch ? (
                <code>{coordinates.targetBranch}</code>
              ) : (
                "-"
              )}
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>

        {coordinates.targetBranch && (
          <BranchPanel
            application={application}
            targetBranch={coordinates.targetBranch}
            isTerminal={isTerminalPhase(agentRun.status?.phase)}
          />
        )}
      </PageSection>
      <PageSection
        isFilled
        className="run-detail-chat-section"
        padding={{ default: "padding" }}
      >
        <ChatPanel runName={runName} />
      </PageSection>
    </>
  );
};

export default AgentRunDetailPage;
