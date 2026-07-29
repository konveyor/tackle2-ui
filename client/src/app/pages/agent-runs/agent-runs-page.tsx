import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import {
  Alert,
  Bullseye,
  Button,
  Content,
  EmptyState,
  EmptyStateBody,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  PageSection,
  Spinner,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from "@patternfly/react-core";
import { CubesIcon } from "@patternfly/react-icons";
import {
  ActionsColumn,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@patternfly/react-table";

import { DevPaths } from "@app/Paths";
import type { AgentRun } from "@app/api/agentic/contract";
import {
  useDeleteAgentRunMutation,
  useFetchAgentRuns,
} from "@app/queries/agent-runs";

import { CreateRunModal } from "./components/CreateRunModal";
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

const AgentRunsPage: React.FC = () => {
  const history = useHistory();
  const { agentRuns, isLoading, fetchError } = useFetchAgentRuns();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const deleteRunMutation = useDeleteAgentRunMutation(
    () => {
      setDeleteTarget(null);
      setDeleteError(null);
    },
    (err) => setDeleteError(err.message)
  );

  const sortedRuns = [...agentRuns].sort((a, b) => {
    const ta = a.metadata.creationTimestamp ?? "";
    const tb = b.metadata.creationTimestamp ?? "";
    return tb.localeCompare(ta);
  });

  const openRun = (name: string) => {
    history.push(DevPaths.agentRunDetail.replace(":runName", name));
  };

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Content>
          <Content component="h1">Agent Runs</Content>
        </Content>
      </PageSection>
      <PageSection>
        {fetchError && (
          <Alert
            variant="danger"
            isInline
            title="Failed to load agent runs"
            style={{ marginBottom: "1rem" }}
          >
            {fetchError instanceof Error
              ? fetchError.message
              : String(fetchError)}
          </Alert>
        )}

        <Toolbar>
          <ToolbarContent>
            <ToolbarItem>
              <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
                Create run
              </Button>
            </ToolbarItem>
          </ToolbarContent>
        </Toolbar>

        {isLoading && agentRuns.length === 0 ? (
          <Bullseye>
            <Spinner aria-label="Loading agent runs" />
          </Bullseye>
        ) : sortedRuns.length === 0 ? (
          <EmptyState
            headingLevel="h2"
            icon={CubesIcon}
            titleText="No agent runs"
          >
            <EmptyStateBody>
              No AgentRun resources found. Create one to get started.
            </EmptyStateBody>
            <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
              Create run
            </Button>
          </EmptyState>
        ) : (
          <Table aria-label="Agent runs" variant="compact">
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Agent</Th>
                <Th>Phase</Th>
                <Th>Age</Th>
                <Th>Duration</Th>
                <Th screenReaderText="Actions" />
              </Tr>
            </Thead>
            <Tbody>
              {sortedRuns.map((run: AgentRun) => {
                const name = run.metadata.name ?? "";
                return (
                  <Tr key={name}>
                    <Td dataLabel="Name">
                      <Button
                        variant="link"
                        isInline
                        onClick={() => openRun(name)}
                      >
                        {name}
                      </Button>
                    </Td>
                    <Td dataLabel="Agent">{run.spec.agentRef}</Td>
                    <Td dataLabel="Phase">
                      <PhaseLabel phase={run.status?.phase} />
                    </Td>
                    <Td dataLabel="Age">
                      {formatAge(run.metadata.creationTimestamp)}
                    </Td>
                    <Td dataLabel="Duration">
                      {formatDuration(run.status?.duration)}
                    </Td>
                    <Td isActionCell>
                      <ActionsColumn
                        items={[
                          {
                            title: "Delete",
                            onClick: () => setDeleteTarget(name),
                          },
                        ]}
                      />
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        )}
      </PageSection>

      {isCreateOpen && (
        <CreateRunModal
          onClose={() => setIsCreateOpen(false)}
          onCreated={(name) => {
            setIsCreateOpen(false);
            openRun(name);
          }}
        />
      )}

      <Modal
        variant="small"
        isOpen={!!deleteTarget}
        onClose={() => {
          setDeleteTarget(null);
          setDeleteError(null);
        }}
      >
        <ModalHeader title="Delete agent run" />
        <ModalBody>
          Are you sure you want to delete <strong>{deleteTarget}</strong>? This
          will terminate the sandbox and cannot be undone.
          {deleteError && (
            <Alert
              variant="danger"
              isInline
              title="Delete failed"
              style={{ marginTop: "0.5rem" }}
            >
              {deleteError}
            </Alert>
          )}
        </ModalBody>
        <ModalFooter>
          <Button
            variant="danger"
            isLoading={deleteRunMutation.isLoading}
            isDisabled={deleteRunMutation.isLoading}
            onClick={() => {
              if (deleteTarget) deleteRunMutation.mutate(deleteTarget);
            }}
          >
            Delete
          </Button>
          <Button
            variant="link"
            onClick={() => {
              setDeleteTarget(null);
              setDeleteError(null);
            }}
          >
            Cancel
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};

export default AgentRunsPage;
