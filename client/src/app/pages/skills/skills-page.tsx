import React, { useState } from "react";
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

import type { SkillCard, SkillCollection } from "@app/api/agentic/contract";
import { LoadDefaultsButton } from "@app/pages/agent-runs/components/LoadDefaultsButton";
import { ReadyLabel } from "@app/pages/agent-runs/components/sources";
import {
  useDeleteSkillCardMutation,
  useDeleteSkillCollectionMutation,
  useFetchSkillCards,
  useFetchSkillCollections,
} from "@app/queries/agent-runs";

import { SkillCardModal } from "./components/SkillCardModal";
import { SkillCollectionModal } from "./components/SkillCollectionModal";

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

function sourceLabel(spec: SkillCard["spec"]): string {
  if (spec.image) return "image";
  if (spec.inline) return "inline";
  if (spec.source) return "git";
  return "-";
}

const SkillsPage: React.FC = () => {
  const {
    skillCards,
    isLoading: cardsLoading,
    fetchError: cardsError,
  } = useFetchSkillCards();
  const {
    skillCollections,
    isLoading: collectionsLoading,
    fetchError: collectionsError,
  } = useFetchSkillCollections();

  const [cardModalTarget, setCardModalTarget] = useState<
    SkillCard | "create" | null
  >(null);
  const [collectionModalTarget, setCollectionModalTarget] = useState<
    SkillCollection | "create" | null
  >(null);

  const [deleteCardTarget, setDeleteCardTarget] = useState<string | null>(null);
  const [deleteCardError, setDeleteCardError] = useState<string | null>(null);
  const [deleteCollectionTarget, setDeleteCollectionTarget] = useState<
    string | null
  >(null);
  const [deleteCollectionError, setDeleteCollectionError] = useState<
    string | null
  >(null);

  const deleteCardMutation = useDeleteSkillCardMutation(
    () => {
      setDeleteCardTarget(null);
      setDeleteCardError(null);
    },
    (err) => setDeleteCardError(err.message)
  );

  const deleteCollectionMutation = useDeleteSkillCollectionMutation(
    () => {
      setDeleteCollectionTarget(null);
      setDeleteCollectionError(null);
    },
    (err) => setDeleteCollectionError(err.message)
  );

  const sortedCards = [...skillCards].sort((a, b) => {
    const ta = a.metadata.creationTimestamp ?? "";
    const tb = b.metadata.creationTimestamp ?? "";
    return tb.localeCompare(ta);
  });

  const sortedCollections = [...skillCollections].sort((a, b) => {
    const ta = a.metadata.creationTimestamp ?? "";
    const tb = b.metadata.creationTimestamp ?? "";
    return tb.localeCompare(ta);
  });

  return (
    <>
      {/* ---- Skill Cards ---- */}
      <PageSection hasBodyWrapper={false}>
        <Content>
          <Content component="h1">Skills</Content>
        </Content>
      </PageSection>
      <PageSection>
        <Content>
          <Content component="h2">Skill Cards</Content>
        </Content>

        {cardsError && (
          <Alert
            variant="danger"
            isInline
            title="Failed to load skill cards"
            style={{ marginBottom: "1rem" }}
          >
            {cardsError instanceof Error
              ? cardsError.message
              : String(cardsError)}
          </Alert>
        )}

        <Toolbar>
          <ToolbarContent>
            <ToolbarItem>
              <Button
                variant="primary"
                onClick={() => setCardModalTarget("create")}
              >
                Create skill card
              </Button>
            </ToolbarItem>
            <ToolbarItem>
              <LoadDefaultsButton />
            </ToolbarItem>
          </ToolbarContent>
        </Toolbar>

        {cardsLoading && skillCards.length === 0 ? (
          <Bullseye>
            <Spinner aria-label="Loading skill cards" />
          </Bullseye>
        ) : sortedCards.length === 0 ? (
          <EmptyState
            headingLevel="h3"
            icon={CubesIcon}
            titleText="No skill cards"
          >
            <EmptyStateBody>
              No SkillCard resources found. Create one to get started.
            </EmptyStateBody>
            <Button
              variant="primary"
              onClick={() => setCardModalTarget("create")}
            >
              Create skill card
            </Button>{" "}
            <LoadDefaultsButton />
          </EmptyState>
        ) : (
          <Table aria-label="Skill cards" variant="compact">
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Display name</Th>
                <Th>Type</Th>
                <Th>Source</Th>
                <Th>Ready</Th>
                <Th>Tags</Th>
                <Th>Age</Th>
                <Th screenReaderText="Actions" />
              </Tr>
            </Thead>
            <Tbody>
              {sortedCards.map((card: SkillCard) => {
                const name = card.metadata.name ?? "";
                return (
                  <Tr key={name}>
                    <Td dataLabel="Name">{name}</Td>
                    <Td dataLabel="Display name">
                      {card.spec.displayName ?? "-"}
                    </Td>
                    <Td dataLabel="Type">
                      <Label
                        color={card.spec.type === "rule" ? "orange" : "blue"}
                      >
                        {card.spec.type ?? "skill"}
                      </Label>
                    </Td>
                    <Td dataLabel="Source">{sourceLabel(card.spec)}</Td>
                    <Td dataLabel="Ready">
                      <ReadyLabel conditions={card.status?.conditions} />
                    </Td>
                    <Td dataLabel="Tags">
                      {card.spec.tags?.join(", ") ?? "-"}
                    </Td>
                    <Td dataLabel="Age">
                      {formatAge(card.metadata.creationTimestamp)}
                    </Td>
                    <Td isActionCell>
                      <ActionsColumn
                        items={[
                          {
                            title: "Edit",
                            onClick: () => setCardModalTarget(card),
                          },
                          {
                            title: "Delete",
                            onClick: () => setDeleteCardTarget(name),
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

      {/* ---- Skill Collections ---- */}
      <PageSection>
        <Content>
          <Content component="h2">Skill Collections</Content>
        </Content>

        {collectionsError && (
          <Alert
            variant="danger"
            isInline
            title="Failed to load skill collections"
            style={{ marginBottom: "1rem" }}
          >
            {collectionsError instanceof Error
              ? collectionsError.message
              : String(collectionsError)}
          </Alert>
        )}

        <Toolbar>
          <ToolbarContent>
            <ToolbarItem>
              <Button
                variant="primary"
                onClick={() => setCollectionModalTarget("create")}
              >
                Create skill collection
              </Button>
            </ToolbarItem>
          </ToolbarContent>
        </Toolbar>

        {collectionsLoading && skillCollections.length === 0 ? (
          <Bullseye>
            <Spinner aria-label="Loading skill collections" />
          </Bullseye>
        ) : sortedCollections.length === 0 ? (
          <EmptyState
            headingLevel="h3"
            icon={CubesIcon}
            titleText="No skill collections"
          >
            <EmptyStateBody>
              No SkillCollection resources found. Create one to get started.
            </EmptyStateBody>
            <Button
              variant="primary"
              onClick={() => setCollectionModalTarget("create")}
            >
              Create skill collection
            </Button>{" "}
            <LoadDefaultsButton />
          </EmptyState>
        ) : (
          <Table aria-label="Skill collections" variant="compact">
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Skills</Th>
                <Th>Ready</Th>
                <Th>Age</Th>
                <Th screenReaderText="Actions" />
              </Tr>
            </Thead>
            <Tbody>
              {sortedCollections.map((col: SkillCollection) => {
                const name = col.metadata.name ?? "";
                return (
                  <Tr key={name}>
                    <Td dataLabel="Name">{name}</Td>
                    <Td dataLabel="Skills">{col.spec.skills?.length ?? 0}</Td>
                    <Td dataLabel="Ready">
                      <ReadyLabel conditions={col.status?.conditions} />
                    </Td>
                    <Td dataLabel="Age">
                      {formatAge(col.metadata.creationTimestamp)}
                    </Td>
                    <Td isActionCell>
                      <ActionsColumn
                        items={[
                          {
                            title: "Edit",
                            onClick: () => setCollectionModalTarget(col),
                          },
                          {
                            title: "Delete",
                            onClick: () => setDeleteCollectionTarget(name),
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

      {/* ---- Modals ---- */}
      {cardModalTarget && (
        <SkillCardModal
          existing={cardModalTarget === "create" ? undefined : cardModalTarget}
          onClose={() => setCardModalTarget(null)}
        />
      )}

      {collectionModalTarget && (
        <SkillCollectionModal
          existing={
            collectionModalTarget === "create"
              ? undefined
              : collectionModalTarget
          }
          onClose={() => setCollectionModalTarget(null)}
        />
      )}

      {/* Delete skill card confirmation */}
      <Modal
        variant="small"
        isOpen={!!deleteCardTarget}
        onClose={() => {
          setDeleteCardTarget(null);
          setDeleteCardError(null);
        }}
      >
        <ModalHeader title="Delete skill card" />
        <ModalBody>
          Are you sure you want to delete <strong>{deleteCardTarget}</strong>?
          This cannot be undone.
          {deleteCardError && (
            <Alert
              variant="danger"
              isInline
              title="Delete failed"
              style={{ marginTop: "0.5rem" }}
            >
              {deleteCardError}
            </Alert>
          )}
        </ModalBody>
        <ModalFooter>
          <Button
            variant="danger"
            isLoading={deleteCardMutation.isLoading}
            isDisabled={deleteCardMutation.isLoading}
            onClick={() => {
              if (deleteCardTarget) deleteCardMutation.mutate(deleteCardTarget);
            }}
          >
            Delete
          </Button>
          <Button
            variant="link"
            onClick={() => {
              setDeleteCardTarget(null);
              setDeleteCardError(null);
            }}
          >
            Cancel
          </Button>
        </ModalFooter>
      </Modal>

      {/* Delete skill collection confirmation */}
      <Modal
        variant="small"
        isOpen={!!deleteCollectionTarget}
        onClose={() => {
          setDeleteCollectionTarget(null);
          setDeleteCollectionError(null);
        }}
      >
        <ModalHeader title="Delete skill collection" />
        <ModalBody>
          Are you sure you want to delete{" "}
          <strong>{deleteCollectionTarget}</strong>? This cannot be undone.
          {deleteCollectionError && (
            <Alert
              variant="danger"
              isInline
              title="Delete failed"
              style={{ marginTop: "0.5rem" }}
            >
              {deleteCollectionError}
            </Alert>
          )}
        </ModalBody>
        <ModalFooter>
          <Button
            variant="danger"
            isLoading={deleteCollectionMutation.isLoading}
            isDisabled={deleteCollectionMutation.isLoading}
            onClick={() => {
              if (deleteCollectionTarget)
                deleteCollectionMutation.mutate(deleteCollectionTarget);
            }}
          >
            Delete
          </Button>
          <Button
            variant="link"
            onClick={() => {
              setDeleteCollectionTarget(null);
              setDeleteCollectionError(null);
            }}
          >
            Cancel
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};

export default SkillsPage;
