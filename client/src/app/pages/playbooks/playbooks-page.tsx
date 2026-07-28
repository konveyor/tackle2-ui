import React, { useState } from "react";
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
  Truncate,
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

import type { AgentPlaybook } from "@app/api/agentic/contract";
import { ReadyLabel } from "@app/pages/agent-runs/components/sources";
import {
  useDeletePlaybookMutation,
  useFetchPlaybooks,
} from "@app/queries/agent-runs";

import { PlaybookComposerModal } from "./components/PlaybookComposerModal";

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

function stagesSummary(playbook: AgentPlaybook): string {
  const stages = playbook.spec.stages ?? [];
  if (stages.length === 0) return "0 stages";
  const names = stages.map((s) => s.name);
  return `${stages.length}: ${names.join(" → ")}`;
}

const PlaybooksPage: React.FC = () => {
  const { playbooks, isLoading, fetchError } = useFetchPlaybooks();
  const [composerTarget, setComposerTarget] = useState<
    AgentPlaybook | "create" | null
  >(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const deleteMutation = useDeletePlaybookMutation(
    () => {
      setDeleteTarget(null);
      setDeleteError(null);
    },
    (err) => setDeleteError(err.message)
  );

  const sortedPlaybooks = [...playbooks].sort((a, b) => {
    const ta = a.metadata.creationTimestamp ?? "";
    const tb = b.metadata.creationTimestamp ?? "";
    return tb.localeCompare(ta);
  });

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Content>
          <Content component="h1">Playbooks</Content>
        </Content>
      </PageSection>
      <PageSection>
        {fetchError && (
          <Alert
            variant="danger"
            isInline
            title="Failed to load playbooks"
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
              <Button
                variant="primary"
                onClick={() => setComposerTarget("create")}
              >
                Create playbook
              </Button>
            </ToolbarItem>
          </ToolbarContent>
        </Toolbar>

        {isLoading && playbooks.length === 0 ? (
          <Bullseye>
            <Spinner aria-label="Loading playbooks" />
          </Bullseye>
        ) : sortedPlaybooks.length === 0 ? (
          <EmptyState
            headingLevel="h2"
            icon={CubesIcon}
            titleText="No playbooks"
          >
            <EmptyStateBody>
              No AgentPlaybook resources found. Create one to orchestrate
              multi-stage agent workflows.
            </EmptyStateBody>
            <Button
              variant="primary"
              onClick={() => setComposerTarget("create")}
            >
              Create playbook
            </Button>
          </EmptyState>
        ) : (
          <Table aria-label="Playbooks" variant="compact">
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Stages</Th>
                <Th>Guide</Th>
                <Th>Ready</Th>
                <Th>Age</Th>
                <Th screenReaderText="Actions" />
              </Tr>
            </Thead>
            <Tbody>
              {sortedPlaybooks.map((pb: AgentPlaybook) => {
                const name = pb.metadata.name ?? "";
                return (
                  <Tr key={name}>
                    <Td dataLabel="Name">{name}</Td>
                    <Td dataLabel="Stages">{stagesSummary(pb)}</Td>
                    <Td dataLabel="Guide">
                      {pb.spec.guide ? (
                        <Truncate content={pb.spec.guide} />
                      ) : (
                        "-"
                      )}
                    </Td>
                    <Td dataLabel="Ready">
                      <ReadyLabel conditions={pb.status?.conditions} />
                    </Td>
                    <Td dataLabel="Age">
                      {formatAge(pb.metadata.creationTimestamp)}
                    </Td>
                    <Td isActionCell>
                      <ActionsColumn
                        items={[
                          {
                            title: "Edit",
                            onClick: () => setComposerTarget(pb),
                          },
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

      {composerTarget !== null && (
        <PlaybookComposerModal
          existing={composerTarget === "create" ? undefined : composerTarget}
          onClose={() => setComposerTarget(null)}
          onSaved={() => setComposerTarget(null)}
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
        <ModalHeader title="Delete playbook" />
        <ModalBody>
          Are you sure you want to delete <strong>{deleteTarget}</strong>? This
          action cannot be undone.
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

export default PlaybooksPage;
