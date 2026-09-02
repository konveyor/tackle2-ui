import "./skills.css";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  ButtonVariant,
  Content,
  EmptyState,
  EmptyStateBody,
  PageSection,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  Tooltip,
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
import { useHasSomeScopes } from "@app/auth";
import { AppPlaceholder } from "@app/components/AppPlaceholder";
import { ConditionalRender } from "@app/components/ConditionalRender";
import { ConfirmDialog } from "@app/components/ConfirmDialog";
import { useNotifications } from "@app/components/NotificationsContext";
import { StateError } from "@app/components/StateError";
import { ReadyLabel } from "@app/pages/agent-runs/components/ReadyLabel";
import { useFetchAgents } from "@app/queries/agents";
import {
  useDeleteSkillCardMutation,
  useDeleteSkillCollectionMutation,
  useFetchSkillCards,
  useFetchSkillCollections,
} from "@app/queries/skills";
import {
  agenticSkillCollectionsWriteScopes,
  agenticSkillsWriteScopes,
} from "@app/scopes";
import { formatAge } from "@app/utils/agentic";
import { getAxiosErrorMessage } from "@app/utils/utils";

import { SkillCardDetailDrawer } from "./components/SkillCardDetailDrawer";
import { SkillCardModal } from "./components/SkillCardModal";
import {
  SkillCollectionDetailDrawer,
  isEnumeratedCollection,
} from "./components/SkillCollectionDetailDrawer";
import { SkillCollectionModal } from "./components/SkillCollectionModal";
import {
  ResolvableLabel,
  SkillDescription,
  SkillSourceLabel,
  SkillTypeLabel,
} from "./components/SkillLabels";

/**
 * The one object whose drawer is open; only one drawer at a time. The uid
 * (when the server reports one) pins the selection to that object, so a
 * re-created namesake does not re-open a drawer the user never asked for.
 */
interface Selection {
  kind: "card" | "collection";
  name: string;
  uid?: string;
}

const matchesSelection = (
  item: { metadata: { name?: string; uid?: string } },
  selected: Selection
) => item.metadata.name === selected.name && item.metadata.uid === selected.uid;

const byNewest = <T extends { metadata: { creationTimestamp?: string } }>(
  a: T,
  b: T
) =>
  (b.metadata.creationTimestamp ?? "").localeCompare(
    a.metadata.creationTimestamp ?? ""
  );

/** A count that lists the names on hover. */
const CountWithNames: React.FC<{ count: React.ReactNode; names: string[] }> = ({
  count,
  names,
}) =>
  names.length === 0 ? (
    <>{count}</>
  ) : (
    <Tooltip
      content={
        <div>
          {names.map((n) => (
            <div key={n}>{n}</div>
          ))}
        </div>
      }
    >
      <span>{count}</span>
    </Tooltip>
  );

const SkillsPage: React.FC = () => {
  const { t } = useTranslation();
  const { pushNotification } = useNotifications();
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
  // Only for the drawers' "Referenced by" section.
  const { agents } = useFetchAgents();
  // Authoring is admin/architect (tackle2-hub#1119); everyone else reads.
  const canWriteCards = useHasSomeScopes(agenticSkillsWriteScopes);
  const canWriteCollections = useHasSomeScopes(
    agenticSkillCollectionsWriteScopes
  );

  const [cardModalTarget, setCardModalTarget] = useState<
    SkillCard | "create" | null
  >(null);
  const [collectionModalTarget, setCollectionModalTarget] = useState<
    SkillCollection | "create" | null
  >(null);

  const [deleteCardTarget, setDeleteCardTarget] = useState<string | null>(null);
  const [deleteCollectionTarget, setDeleteCollectionTarget] = useState<
    string | null
  >(null);

  // ---- detail drawer: the selection is a reference; the object is read live
  // from the query result, so the drawer follows refetches and collapses the
  // moment the object is gone (deleted here or by someone else).
  const [selected, setSelected] = useState<Selection | null>(null);
  const selectedCard =
    selected?.kind === "card"
      ? (skillCards.find((c) => matchesSelection(c, selected)) ?? null)
      : null;
  const selectedCollection =
    selected?.kind === "collection"
      ? (skillCollections.find((c) => matchesSelection(c, selected)) ?? null)
      : null;

  const selectCard = (card: SkillCard) =>
    setSelected({
      kind: "card",
      name: card.metadata.name ?? "",
      uid: card.metadata.uid,
    });
  const selectCollection = (col: SkillCollection) =>
    setSelected({
      kind: "collection",
      name: col.metadata.name ?? "",
      uid: col.metadata.uid,
    });
  const closeDrawer = () => setSelected(null);
  const forgetSelection = (kind: Selection["kind"], name: string) =>
    setSelected((prev) =>
      prev?.kind === kind && prev.name === name ? null : prev
    );

  const deleteCardMutation = useDeleteSkillCardMutation(
    (name) => {
      setDeleteCardTarget(null);
      forgetSelection("card", name);
      pushNotification({
        title: t("toastr.success.deletedWhat", {
          what: name,
          type: t("terms.skillCard"),
        }),
        variant: "success",
      });
    },
    (err) => {
      setDeleteCardTarget(null);
      pushNotification({ title: getAxiosErrorMessage(err), variant: "danger" });
    }
  );

  const deleteCollectionMutation = useDeleteSkillCollectionMutation(
    (name) => {
      setDeleteCollectionTarget(null);
      forgetSelection("collection", name);
      pushNotification({
        title: t("toastr.success.deletedWhat", {
          what: name,
          type: t("terms.skillCollection"),
        }),
        variant: "success",
      });
    },
    (err) => {
      setDeleteCollectionTarget(null);
      pushNotification({ title: getAxiosErrorMessage(err), variant: "danger" });
    }
  );

  const sortedCards = [...skillCards].sort(byNewest);
  const sortedCollections = [...skillCollections].sort(byNewest);

  // Clicks inside the actions cell and the name link must not reach the row,
  // whose click toggles the drawer.
  const stopRowClick = (e: React.MouseEvent) => e.stopPropagation();

  // PF's Tr routes Enter/Space from the whole row subtree into onRowClick and
  // preventDefault()s, which swallows the kebab's and name link's own
  // activation. Own the keydown instead: act only when the <tr> itself has
  // focus.
  const rowKeyDown =
    (activate: () => void) => (e: React.KeyboardEvent<HTMLTableRowElement>) => {
      if (e.target !== e.currentTarget) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        activate();
      }
    };

  return (
    <>
      {/* ---- Skill Cards ---- */}
      <PageSection hasBodyWrapper={false}>
        <Content>
          <Content component="h1">{t("terms.skills")}</Content>
        </Content>
      </PageSection>
      <PageSection>
        <Content>
          <Content component="h2">{t("terms.skillCards")}</Content>
        </Content>

        <ConditionalRender
          when={cardsLoading && skillCards.length === 0 && !cardsError}
          then={<AppPlaceholder />}
        >
          {/* Toolbar CTA only when the table has rows; the empty state
              carries its own create button, so showing both duplicates it. */}
          {canWriteCards && sortedCards.length > 0 && (
            <Toolbar>
              <ToolbarContent>
                <ToolbarItem>
                  <Button
                    variant="primary"
                    onClick={() => setCardModalTarget("create")}
                  >
                    {t("agentic.skills.createSkillCard")}
                  </Button>
                </ToolbarItem>
              </ToolbarContent>
            </Toolbar>
          )}

          {cardsError ? (
            <StateError />
          ) : sortedCards.length === 0 ? (
            <EmptyState
              headingLevel="h3"
              icon={CubesIcon}
              titleText={t("agentic.skills.noSkillCardsTitle")}
            >
              <EmptyStateBody>
                {t("agentic.skills.noSkillCardsBody")}
              </EmptyStateBody>
              <EmptyStateBody>{t("agentic.emptyStateSeedHint")}</EmptyStateBody>
              {canWriteCards && (
                <Button
                  variant="primary"
                  onClick={() => setCardModalTarget("create")}
                >
                  {t("agentic.skills.createSkillCard")}
                </Button>
              )}
            </EmptyState>
          ) : (
            <Table aria-label={t("terms.skillCards")} variant="compact">
              <Thead>
                <Tr>
                  <Th>{t("terms.name")}</Th>
                  <Th>{t("terms.displayName")}</Th>
                  <Th>{t("terms.description")}</Th>
                  <Th>{t("terms.type")}</Th>
                  <Th>{t("terms.source")}</Th>
                  <Th>{t("agentic.skills.ready")}</Th>
                  <Th>{t("terms.tags")}</Th>
                  <Th>{t("terms.age")}</Th>
                  <Th screenReaderText={t("actions.rowActions")} />
                </Tr>
              </Thead>
              <Tbody>
                {sortedCards.map((card: SkillCard) => {
                  const name = card.metadata.name ?? "";
                  const toggleCard = () =>
                    selectedCard === card ? closeDrawer() : selectCard(card);
                  return (
                    <Tr
                      key={name}
                      isClickable
                      isRowSelected={selectedCard === card}
                      onRowClick={toggleCard}
                      onKeyDown={rowKeyDown(toggleCard)}
                    >
                      <Td dataLabel={t("terms.name")}>
                        <Button
                          variant="link"
                          isInline
                          onClick={(e) => {
                            stopRowClick(e);
                            selectCard(card);
                          }}
                        >
                          {name}
                        </Button>
                      </Td>
                      <Td dataLabel={t("terms.displayName")}>
                        {card.spec.displayName ?? "-"}
                      </Td>
                      <Td dataLabel={t("terms.description")}>
                        <SkillDescription text={card.spec.description} />
                      </Td>
                      <Td dataLabel={t("terms.type")}>
                        <SkillTypeLabel type={card.spec.type} />
                      </Td>
                      <Td dataLabel={t("terms.source")}>
                        <SkillSourceLabel
                          spec={card.spec}
                          status={card.status}
                        />
                      </Td>
                      <Td dataLabel={t("agentic.skills.ready")}>
                        <span className="skills-ready-cell">
                          <ReadyLabel conditions={card.status?.conditions} />
                          {/* Flag a phantom or unverified artifact in the list
                              itself, so it is visible before a run. Present
                              artifacts stay quiet — the green Ready is enough. */}
                          <ResolvableLabel
                            conditions={card.status?.conditions}
                            omitPresent
                            isCompact
                          />
                        </span>
                      </Td>
                      <Td dataLabel={t("terms.tags")}>
                        {card.spec.tags?.length
                          ? card.spec.tags.join(", ")
                          : "-"}
                      </Td>
                      <Td dataLabel={t("terms.age")}>
                        {formatAge(card.metadata.creationTimestamp)}
                      </Td>
                      <Td isActionCell onClick={stopRowClick}>
                        <ActionsColumn
                          items={[
                            {
                              title: t("actions.view"),
                              onClick: () => selectCard(card),
                            },
                            ...(canWriteCards
                              ? [
                                  {
                                    title: t("actions.edit"),
                                    onClick: () => setCardModalTarget(card),
                                  },
                                  {
                                    title: t("actions.delete"),
                                    onClick: () => setDeleteCardTarget(name),
                                  },
                                ]
                              : []),
                          ]}
                        />
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          )}
        </ConditionalRender>
      </PageSection>

      {/* ---- Skill Collections ---- */}
      <PageSection>
        <Content>
          <Content component="h2">{t("terms.skillCollections")}</Content>
        </Content>

        <ConditionalRender
          when={
            collectionsLoading &&
            skillCollections.length === 0 &&
            !collectionsError
          }
          then={<AppPlaceholder />}
        >
          {/* Toolbar CTA only when the table has rows; the empty state
              carries its own create button, so showing both duplicates it. */}
          {canWriteCollections && sortedCollections.length > 0 && (
            <Toolbar>
              <ToolbarContent>
                <ToolbarItem>
                  <Button
                    variant="primary"
                    onClick={() => setCollectionModalTarget("create")}
                  >
                    {t("agentic.skills.createSkillCollection")}
                  </Button>
                </ToolbarItem>
              </ToolbarContent>
            </Toolbar>
          )}

          {collectionsError ? (
            <StateError />
          ) : sortedCollections.length === 0 ? (
            <EmptyState
              headingLevel="h3"
              icon={CubesIcon}
              titleText={t("agentic.skills.noSkillCollectionsTitle")}
            >
              <EmptyStateBody>
                {t("agentic.skills.noSkillCollectionsBody")}
              </EmptyStateBody>
              <EmptyStateBody>{t("agentic.emptyStateSeedHint")}</EmptyStateBody>
              {canWriteCollections && (
                <Button
                  variant="primary"
                  onClick={() => setCollectionModalTarget("create")}
                >
                  {t("agentic.skills.createSkillCollection")}
                </Button>
              )}
            </EmptyState>
          ) : (
            <Table aria-label={t("terms.skillCollections")} variant="compact">
              <Thead>
                <Tr>
                  <Th>{t("terms.name")}</Th>
                  <Th>{t("terms.mode")}</Th>
                  <Th>{t("terms.skills")}</Th>
                  <Th>{t("agentic.skills.ready")}</Th>
                  <Th>{t("terms.age")}</Th>
                  <Th screenReaderText={t("actions.rowActions")} />
                </Tr>
              </Thead>
              <Tbody>
                {sortedCollections.map((col: SkillCollection) => {
                  const name = col.metadata.name ?? "";
                  const enumerated = isEnumeratedCollection(col);
                  // Enumerated: the controller reports what it found; "—"
                  // until it has. Explicit: the members in the spec.
                  const memberNames = enumerated
                    ? (col.status?.resolvedSkills ?? [])
                    : (col.spec.skills?.map((s) => s.name) ?? []);
                  const count =
                    enumerated && !col.status?.resolvedSkills
                      ? "—"
                      : memberNames.length;
                  const toggleCollection = () =>
                    selectedCollection === col
                      ? closeDrawer()
                      : selectCollection(col);
                  return (
                    <Tr
                      key={name}
                      isClickable
                      isRowSelected={selectedCollection === col}
                      onRowClick={toggleCollection}
                      onKeyDown={rowKeyDown(toggleCollection)}
                    >
                      <Td dataLabel={t("terms.name")}>
                        <Button
                          variant="link"
                          isInline
                          onClick={(e) => {
                            stopRowClick(e);
                            selectCollection(col);
                          }}
                        >
                          {name}
                        </Button>
                      </Td>
                      <Td dataLabel={t("terms.mode")}>
                        {t(
                          enumerated
                            ? "agentic.skills.modeEnumeratedLabel"
                            : "agentic.skills.modeExplicitLabel"
                        )}
                      </Td>
                      <Td dataLabel={t("terms.skills")}>
                        <CountWithNames count={count} names={memberNames} />
                      </Td>
                      <Td dataLabel={t("agentic.skills.ready")}>
                        <ReadyLabel conditions={col.status?.conditions} />
                      </Td>
                      <Td dataLabel={t("terms.age")}>
                        {formatAge(col.metadata.creationTimestamp)}
                      </Td>
                      <Td isActionCell onClick={stopRowClick}>
                        <ActionsColumn
                          items={[
                            {
                              title: t("actions.view"),
                              onClick: () => selectCollection(col),
                            },
                            ...(canWriteCollections
                              ? [
                                  {
                                    title: t("actions.edit"),
                                    onClick: () =>
                                      setCollectionModalTarget(col),
                                  },
                                  {
                                    title: t("actions.delete"),
                                    onClick: () =>
                                      setDeleteCollectionTarget(name),
                                  },
                                ]
                              : []),
                          ]}
                        />
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          )}
        </ConditionalRender>
      </PageSection>

      {/* ---- Detail drawer: exactly one PageDrawerContent mounted at a time ---- */}
      {selected?.kind === "collection" ? (
        <SkillCollectionDetailDrawer
          collection={selectedCollection}
          agents={agents}
          skillCards={skillCards}
          onViewSkillCard={(name) => {
            const card = skillCards.find((c) => c.metadata.name === name);
            if (card) selectCard(card);
          }}
          onCloseClick={closeDrawer}
        />
      ) : (
        <SkillCardDetailDrawer
          card={selectedCard}
          agents={agents}
          skillCollections={skillCollections}
          onViewCollection={(name) => {
            const col = skillCollections.find((c) => c.metadata.name === name);
            if (col) selectCollection(col);
          }}
          onCloseClick={closeDrawer}
        />
      )}

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

      <ConfirmDialog
        title={t("dialog.title.deleteWithName", {
          what: t("terms.skillCard").toLowerCase(),
          name: deleteCardTarget,
        })}
        titleIconVariant="warning"
        isOpen={!!deleteCardTarget}
        message={t("dialog.message.delete")}
        confirmBtnVariant={ButtonVariant.danger}
        confirmBtnLabel={t("actions.delete")}
        cancelBtnLabel={t("actions.cancel")}
        inProgress={deleteCardMutation.isLoading}
        onCancel={() => setDeleteCardTarget(null)}
        onClose={() => setDeleteCardTarget(null)}
        onConfirm={() => {
          if (deleteCardTarget) deleteCardMutation.mutate(deleteCardTarget);
        }}
      />

      <ConfirmDialog
        title={t("dialog.title.deleteWithName", {
          what: t("terms.skillCollection").toLowerCase(),
          name: deleteCollectionTarget,
        })}
        titleIconVariant="warning"
        isOpen={!!deleteCollectionTarget}
        message={t("dialog.message.delete")}
        confirmBtnVariant={ButtonVariant.danger}
        confirmBtnLabel={t("actions.delete")}
        cancelBtnLabel={t("actions.cancel")}
        inProgress={deleteCollectionMutation.isLoading}
        onCancel={() => setDeleteCollectionTarget(null)}
        onClose={() => setDeleteCollectionTarget(null)}
        onConfirm={() => {
          if (deleteCollectionTarget)
            deleteCollectionMutation.mutate(deleteCollectionTarget);
        }}
      />
    </>
  );
};

export default SkillsPage;
