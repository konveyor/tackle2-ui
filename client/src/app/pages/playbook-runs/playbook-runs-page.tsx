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
import type { AgentPlaybookRun } from "@app/api/agentic/contract";
import { PhaseLabel } from "@app/pages/agent-runs/components/PhaseLabel";
import {
  useDeletePlaybookRunMutation,
  useFetchPlaybookRuns,
} from "@app/queries/agent-runs";

import { CreatePlaybookRunModal } from "./components/CreatePlaybookRunModal";

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

/** Playbook-run status has no duration field — derive it from timestamps. */
export function playbookRunDuration(run: AgentPlaybookRun): number | undefined {
  const start = run.status?.startTime;
  if (!start) return undefined;
  const end = run.status?.completionTime;
  const ms = (end ? Date.parse(end) : Date.now()) - Date.parse(start);
  return ms >= 0 ? Math.round(ms / 1000) : undefined;
}

function stagesSummary(run: AgentPlaybookRun): string {
  const stages = run.status?.stages ?? [];
  if (stages.length === 0) return "-";
  const done = stages.filter((s) => s.phase === "Succeeded").length;
  const current = run.status?.currentStage;
  return `${done}/${stages.length}${current ? ` · ${current}` : ""}`;
}

const PlaybookRunsPage: React.FC = () => {
  const history = useHistory();
  const { playbookRuns, isLoading, fetchError } = useFetchPlaybookRuns(2000);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const deleteMutation = useDeletePlaybookRunMutation(
    () => {
      setDeleteTarget(null);
      setDeleteError(null);
    },
    (err) => setDeleteError(err.message)
  );

  const sortedRuns = [...playbookRuns].sort((a, b) => {
    const ta = a.metadata.creationTimestamp ?? "";
    const tb = b.metadata.creationTimestamp ?? "";
    return tb.localeCompare(ta);
  });

  const openRun = (name: string) => {
    history.push(DevPaths.playbookRunDetail.replace(":runName", name));
  };

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Content>
          <Content component="h1">Playbook Runs</Content>
        </Content>
      </PageSection>
      <PageSection>
        {fetchError && (
          <Alert
            variant="danger"
            isInline
            title="Failed to load playbook runs"
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
                Create playbook run
              </Button>
            </ToolbarItem>
          </ToolbarContent>
        </Toolbar>

        {isLoading && playbookRuns.length === 0 ? (
          <Bullseye>
            <Spinner aria-label="Loading playbook runs" />
          </Bullseye>
        ) : sortedRuns.length === 0 ? (
          <EmptyState
            headingLevel="h2"
            icon={CubesIcon}
            titleText="No playbook runs"
          >
            <EmptyStateBody>
              No AgentPlaybookRun resources found. Create one against an
              AgentPlaybook; each stage runs as its own AgentRun, in order.
            </EmptyStateBody>
            <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
              Create playbook run
            </Button>
          </EmptyState>
        ) : (
          <Table aria-label="Playbook runs" variant="compact">
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Playbook</Th>
                <Th>Phase</Th>
                <Th>Stages</Th>
                <Th>Age</Th>
                <Th>Duration</Th>
                <Th screenReaderText="Actions" />
              </Tr>
            </Thead>
            <Tbody>
              {sortedRuns.map((run: AgentPlaybookRun) => {
                const name = run.metadata.name ?? "";
                return (
                  <Tr key={run.metadata.uid ?? name}>
                    <Td dataLabel="Name">
                      <Button
                        variant="link"
                        isInline
                        onClick={() => openRun(name)}
                      >
                        {name}
                      </Button>
                    </Td>
                    <Td dataLabel="Playbook">{run.spec.playbookRef}</Td>
                    <Td dataLabel="Phase">
                      <PhaseLabel phase={run.status?.phase} />
                    </Td>
                    <Td dataLabel="Stages">{stagesSummary(run)}</Td>
                    <Td dataLabel="Age">
                      {formatAge(run.metadata.creationTimestamp)}
                    </Td>
                    <Td dataLabel="Duration">
                      {formatDuration(playbookRunDuration(run))}
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
        <CreatePlaybookRunModal
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
        <ModalHeader title="Delete playbook run" />
        <ModalBody>
          Are you sure you want to delete <strong>{deleteTarget}</strong>? Its
          stage AgentRuns are owner-referenced and are deleted with it.
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
            isLoading={deleteMutation.isLoading}
            isDisabled={deleteMutation.isLoading}
            onClick={() => {
              if (deleteTarget) deleteMutation.mutate(deleteTarget);
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

export default PlaybookRunsPage;
