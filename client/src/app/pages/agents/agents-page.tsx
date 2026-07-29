import React, { useState } from "react";
import { AxiosError } from "axios";
import {
  Alert,
  Bullseye,
  Button,
  Content,
  EmptyState,
  EmptyStateBody,
  Label,
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

import type { AgentResource } from "@app/api/agentic/contract";
import { LoadDefaultsButton } from "@app/pages/agent-runs/components/LoadDefaultsButton";
import {
  ReadyLabel,
  skillCount,
} from "@app/pages/agent-runs/components/sources";
import {
  useDeleteAgentMutation,
  useFetchAgents,
} from "@app/queries/agent-runs";

import { AgentDesignerModal } from "./components/AgentDesignerModal";

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

const AgentsPage: React.FC = () => {
  const { agents, isLoading, fetchError, refetch } = useFetchAgents();
  const [designerTarget, setDesignerTarget] = useState<
    AgentResource | "create" | null
  >(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const deleteAgentMutation = useDeleteAgentMutation(
    () => {
      setDeleteTarget(null);
      setDeleteError(null);
    },
    (err: AxiosError) => setDeleteError(err.message)
  );

  const sortedAgents = [...agents].sort((a, b) => {
    const ta = a.metadata.creationTimestamp ?? "";
    const tb = b.metadata.creationTimestamp ?? "";
    return tb.localeCompare(ta);
  });

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Content>
          <Content component="h1">Agents</Content>
        </Content>
      </PageSection>
      <PageSection>
        {fetchError && (
          <Alert
            variant="danger"
            isInline
            title="Failed to load agents"
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
                onClick={() => setDesignerTarget("create")}
              >
                Create agent
              </Button>
            </ToolbarItem>
            <ToolbarItem>
              <LoadDefaultsButton />
            </ToolbarItem>
          </ToolbarContent>
        </Toolbar>

        {isLoading && agents.length === 0 ? (
          <Bullseye>
            <Spinner aria-label="Loading agents" />
          </Bullseye>
        ) : sortedAgents.length === 0 ? (
          <EmptyState headingLevel="h2" icon={CubesIcon} titleText="No agents">
            <EmptyStateBody>
              No Agent resources found. Create one to get started.
            </EmptyStateBody>
            <Button
              variant="primary"
              onClick={() => setDesignerTarget("create")}
            >
              Create agent
            </Button>{" "}
            <LoadDefaultsButton />
          </EmptyState>
        ) : (
          <Table aria-label="Agents" variant="compact">
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Image</Th>
                <Th>Providers</Th>
                <Th>Skills</Th>
                <Th>Params</Th>
                <Th>Ready</Th>
                <Th>Age</Th>
                <Th screenReaderText="Actions" />
              </Tr>
            </Thead>
            <Tbody>
              {sortedAgents.map((agent: AgentResource) => {
                const name = agent.metadata.name ?? "";
                const skills = skillCount(agent.spec);
                return (
                  <Tr key={name}>
                    <Td dataLabel="Name">{name}</Td>
                    <Td dataLabel="Image">{agent.spec.image}</Td>
                    <Td dataLabel="Providers">
                      {agent.spec.providers?.map((p) => p.ref).join(", ") ||
                        "-"}
                    </Td>
                    <Td dataLabel="Skills">
                      {skills === 0 ? <Label color="red">0</Label> : skills}
                    </Td>
                    <Td dataLabel="Params">{agent.spec.params?.length ?? 0}</Td>
                    <Td dataLabel="Ready">
                      <ReadyLabel conditions={agent.status?.conditions} />
                    </Td>
                    <Td dataLabel="Age">
                      {formatAge(agent.metadata.creationTimestamp)}
                    </Td>
                    <Td isActionCell>
                      <ActionsColumn
                        items={[
                          {
                            title: "Edit",
                            onClick: () => setDesignerTarget(agent),
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

      {designerTarget && (
        <AgentDesignerModal
          existing={designerTarget === "create" ? undefined : designerTarget}
          onClose={() => setDesignerTarget(null)}
          onSaved={() => {
            setDesignerTarget(null);
            refetch();
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
        <ModalHeader title="Delete agent" />
        <ModalBody>
          Are you sure you want to delete <strong>{deleteTarget}</strong>? This
          cannot be undone.
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
            isLoading={deleteAgentMutation.isLoading}
            isDisabled={deleteAgentMutation.isLoading}
            onClick={() => {
              if (deleteTarget) deleteAgentMutation.mutate(deleteTarget);
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

export default AgentsPage;
