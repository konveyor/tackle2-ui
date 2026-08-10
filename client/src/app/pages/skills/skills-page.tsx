import React, { useState } from "react";
import { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import {
  Button,
  ButtonVariant,
  Content,
  EmptyState,
  EmptyStateBody,
  Label,
  PageSection,
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
import { AppPlaceholder } from "@app/components/AppPlaceholder";
import { ConditionalRender } from "@app/components/ConditionalRender";
import { ConfirmDialog } from "@app/components/ConfirmDialog";
import { useNotifications } from "@app/components/NotificationsContext";
import { StateError } from "@app/components/StateError";
import { ReadyLabel } from "@app/pages/agent-runs/components/ReadyLabel";
import {
  useDeleteSkillCardMutation,
  useDeleteSkillCollectionMutation,
  useFetchSkillCards,
  useFetchSkillCollections,
} from "@app/queries/skills";
import { formatAge } from "@app/utils/agentic";
import { getAxiosErrorMessage } from "@app/utils/utils";

import { SkillCardModal } from "./components/SkillCardModal";
import { SkillCollectionModal } from "./components/SkillCollectionModal";

function sourceLabel(spec: SkillCard["spec"], t: TFunction): string {
  if (spec.image) return t("agentic.skills.sourceImage");
  if (spec.inline) return t("agentic.skills.sourceInline");
  if (spec.source) return t("agentic.skills.sourceGit");
  return "-";
}

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

  const deleteCardMutation = useDeleteSkillCardMutation(
    (name) => {
      setDeleteCardTarget(null);
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
              <Button
                variant="primary"
                onClick={() => setCardModalTarget("create")}
              >
                {t("agentic.skills.createSkillCard")}
              </Button>
            </EmptyState>
          ) : (
            <Table aria-label={t("terms.skillCards")} variant="compact">
              <Thead>
                <Tr>
                  <Th>{t("terms.name")}</Th>
                  <Th>{t("terms.displayName")}</Th>
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
                  return (
                    <Tr key={name}>
                      <Td dataLabel={t("terms.name")}>{name}</Td>
                      <Td dataLabel={t("terms.displayName")}>
                        {card.spec.displayName ?? "-"}
                      </Td>
                      <Td dataLabel={t("terms.type")}>
                        <Label
                          color={card.spec.type === "rule" ? "orange" : "blue"}
                        >
                          {card.spec.type ?? "skill"}
                        </Label>
                      </Td>
                      <Td dataLabel={t("terms.source")}>
                        {sourceLabel(card.spec, t)}
                      </Td>
                      <Td dataLabel={t("agentic.skills.ready")}>
                        <ReadyLabel conditions={card.status?.conditions} />
                      </Td>
                      <Td dataLabel={t("terms.tags")}>
                        {card.spec.tags?.join(", ") ?? "-"}
                      </Td>
                      <Td dataLabel={t("terms.age")}>
                        {formatAge(card.metadata.creationTimestamp)}
                      </Td>
                      <Td isActionCell>
                        <ActionsColumn
                          items={[
                            {
                              title: t("actions.edit"),
                              onClick: () => setCardModalTarget(card),
                            },
                            {
                              title: t("actions.delete"),
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
              <Button
                variant="primary"
                onClick={() => setCollectionModalTarget("create")}
              >
                {t("agentic.skills.createSkillCollection")}
              </Button>
            </EmptyState>
          ) : (
            <Table aria-label={t("terms.skillCollections")} variant="compact">
              <Thead>
                <Tr>
                  <Th>{t("terms.name")}</Th>
                  <Th>{t("terms.skills")}</Th>
                  <Th>{t("agentic.skills.ready")}</Th>
                  <Th>{t("terms.age")}</Th>
                  <Th screenReaderText={t("actions.rowActions")} />
                </Tr>
              </Thead>
              <Tbody>
                {sortedCollections.map((col: SkillCollection) => {
                  const name = col.metadata.name ?? "";
                  return (
                    <Tr key={name}>
                      <Td dataLabel={t("terms.name")}>{name}</Td>
                      <Td dataLabel={t("terms.skills")}>
                        {col.spec.skills?.length ?? 0}
                      </Td>
                      <Td dataLabel={t("agentic.skills.ready")}>
                        <ReadyLabel conditions={col.status?.conditions} />
                      </Td>
                      <Td dataLabel={t("terms.age")}>
                        {formatAge(col.metadata.creationTimestamp)}
                      </Td>
                      <Td isActionCell>
                        <ActionsColumn
                          items={[
                            {
                              title: t("actions.edit"),
                              onClick: () => setCollectionModalTarget(col),
                            },
                            {
                              title: t("actions.delete"),
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
        </ConditionalRender>
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
