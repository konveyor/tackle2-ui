import "../skills.css";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Button, Content, Label, Title } from "@patternfly/react-core";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import type {
  AgentResource,
  SkillCard,
  SkillCollection,
  SkillCollectionSkillRef,
} from "@app/api/agentic/contract";
import { PageDrawerContent } from "@app/components/PageDrawerContext";
import {
  DrawerTabContent,
  DrawerTabContentSection,
  DrawerTabsContainer,
  NoEntitySelected,
} from "@app/components/detail-drawer";
import { ReadyLabel } from "@app/pages/agent-runs/components/ReadyLabel";

import {
  AgentLabels,
  ConditionsList,
  DrawerField,
  DrawerFieldList,
  DrawerHint,
} from "./SkillCardDetailDrawer";
import { SkillTypeLabel } from "./SkillLabels";

/** `spec.image` set = the controller enumerates the image; else explicit members. */
export const isEnumeratedCollection = (collection: SkillCollection): boolean =>
  !!collection.spec.image;

type MemberKind = "skillCardRef" | "image" | "source";

const memberKind = (entry: SkillCollectionSkillRef): MemberKind | undefined =>
  entry.skillCardRef
    ? "skillCardRef"
    : entry.image
      ? "image"
      : entry.source
        ? "source"
        : undefined;

interface SkillCollectionDetailDrawerProps {
  collection: SkillCollection | null;
  onCloseClick: () => void;
  agents: AgentResource[];
  skillCards: SkillCard[];
  /** Open a member skill card's drawer (only offered when the card exists). */
  onViewSkillCard: (name: string) => void;
}

export const SkillCollectionDetailDrawer: React.FC<
  SkillCollectionDetailDrawerProps
> = ({ collection, onCloseClick, agents, skillCards, onViewSkillCard }) => {
  const { t } = useTranslation();

  return (
    <PageDrawerContent
      isExpanded={!!collection}
      onCloseClick={onCloseClick}
      pageKey="skill-collection-details"
      header={
        <Content>
          <Content component="small" className={spacing.mb_0}>
            {t("agentic.skills.skillCollectionDetails")}
          </Content>
          <Title headingLevel="h2" size="lg" className={spacing.mtXs}>
            {collection
              ? (collection.metadata.name ?? "")
              : t("agentic.skills.noSkillCollectionSelected")}
          </Title>
        </Content>
      }
    >
      {collection ? (
        <DrawerTabsContainer>
          <DrawerTabContent>
            <SkillCollectionDetails
              collection={collection}
              agents={agents}
              skillCards={skillCards}
              onViewSkillCard={onViewSkillCard}
            />
          </DrawerTabContent>
        </DrawerTabsContainer>
      ) : (
        <NoEntitySelected
          entityName={t("terms.skillCollection").toLowerCase()}
        />
      )}
    </PageDrawerContent>
  );
};

const SkillCollectionDetails: React.FC<{
  collection: SkillCollection;
  agents: AgentResource[];
  skillCards: SkillCard[];
  onViewSkillCard: (name: string) => void;
}> = ({ collection, agents, skillCards, onViewSkillCard }) => {
  const { t } = useTranslation();
  const name = collection.metadata.name ?? "";
  const { spec, status } = collection;
  const enumerated = isEnumeratedCollection(collection);

  const cardNames = useMemo(
    () => new Set(skillCards.map((c) => c.metadata.name)),
    [skillCards]
  );

  const referencingAgents = useMemo(
    () =>
      agents.filter((a) =>
        a.spec.skillCollections?.some((r) => r.ref === name)
      ),
    [agents, name]
  );

  /** The card's name as a link into its drawer when the card exists, else plain text. */
  const cardLink = (cardName: string) =>
    cardNames.has(cardName) ? (
      <Button variant="link" isInline onClick={() => onViewSkillCard(cardName)}>
        {cardName}
      </Button>
    ) : (
      <span>{cardName}</span>
    );

  return (
    <>
      <DrawerTabContentSection label={t("terms.details")}>
        <DrawerFieldList>
          <DrawerField term={t("terms.name")}>{name}</DrawerField>
          <DrawerField term={t("terms.version")}>
            {spec.version ?? "-"}
          </DrawerField>
          <DrawerField term={t("terms.mode")}>
            {t(
              enumerated
                ? "agentic.skills.modeEnumeratedLabel"
                : "agentic.skills.modeExplicitLabel"
            )}
            <DrawerHint>
              {t(
                enumerated
                  ? "agentic.skills.enumerateHelper"
                  : "agentic.skills.modeExplicitHelp"
              )}
            </DrawerHint>
          </DrawerField>
          {enumerated && (
            <>
              <DrawerField term={t("terms.image")}>
                <span className="skills-drawer__mono">{spec.image}</span>
              </DrawerField>
              <DrawerField term={t("terms.type")}>
                <SkillTypeLabel type={spec.type} />
                <DrawerHint>
                  {t("agentic.skills.enumerateTypeHelper")}
                </DrawerHint>
              </DrawerField>
            </>
          )}
        </DrawerFieldList>
      </DrawerTabContentSection>

      <DrawerTabContentSection label={t("agentic.skills.members")}>
        {enumerated ? (
          status?.resolvedSkills?.length ? (
            <ul className="skills-drawer__plain-list">
              {status.resolvedSkills.map((skillName) => (
                <li key={skillName}>{cardLink(skillName)}</li>
              ))}
            </ul>
          ) : (
            <Content component="p">
              {t("agentic.skills.notEnumeratedYet")}
            </Content>
          )
        ) : spec.skills?.length ? (
          <div>
            {spec.skills.map((entry, i) => (
              <MemberEntry
                key={`${entry.name}-${i}`}
                entry={entry}
                cardExists={
                  !!entry.skillCardRef && cardNames.has(entry.skillCardRef)
                }
                onViewSkillCard={onViewSkillCard}
              />
            ))}
          </div>
        ) : (
          <Content component="p">{t("terms.none")}</Content>
        )}
      </DrawerTabContentSection>

      <DrawerTabContentSection label={t("terms.status")}>
        <DrawerFieldList>
          <DrawerField term={t("agentic.skills.ready")}>
            <ReadyLabel conditions={status?.conditions} />
          </DrawerField>
          <DrawerField term={t("agentic.skills.conditions")}>
            <ConditionsList conditions={status?.conditions} />
          </DrawerField>
        </DrawerFieldList>
      </DrawerTabContentSection>

      <DrawerTabContentSection label={t("agentic.skills.referencedBy")}>
        <DrawerFieldList>
          <DrawerField term={t("terms.agents")}>
            <AgentLabels agents={referencingAgents} />
          </DrawerField>
        </DrawerFieldList>
      </DrawerTabContentSection>
    </>
  );
};

/** One explicit member: name · kind · (type), then its reference and sub-path. */
const MemberEntry: React.FC<{
  entry: SkillCollectionSkillRef;
  cardExists: boolean;
  onViewSkillCard: (name: string) => void;
}> = ({ entry, cardExists, onViewSkillCard }) => {
  const { t } = useTranslation();
  const kind = memberKind(entry);

  const kindText =
    kind === "skillCardRef"
      ? t("agentic.skills.memberKindSkillCard")
      : kind === "image"
        ? t("agentic.skills.sourceImage")
        : kind === "source"
          ? t("agentic.skills.sourceGit")
          : undefined;

  return (
    <div className="skills-drawer__member">
      <div className="skills-drawer__member-line">
        <strong>{entry.name}</strong>
        {kindText && (
          <Label variant="outline" isCompact>
            {kindText}
          </Label>
        )}
        {/* A skillCardRef entry's type is ignored: the card carries its own. */}
        {kind !== "skillCardRef" && kind !== undefined && (
          <SkillTypeLabel type={entry.type} isCompact />
        )}
      </div>
      <div className="skills-drawer__member-line">
        {kind === "skillCardRef" && entry.skillCardRef && (
          <>
            {cardExists ? (
              <Button
                variant="link"
                isInline
                onClick={() => onViewSkillCard(entry.skillCardRef ?? "")}
              >
                {entry.skillCardRef}
              </Button>
            ) : (
              <>
                <span>{entry.skillCardRef}</span>
                <Label color="grey" isCompact>
                  {t("agentic.skills.cardNotFound")}
                </Label>
              </>
            )}
          </>
        )}
        {kind === "image" && (
          <span className="skills-drawer__mono">{entry.image}</span>
        )}
        {kind === "source" && (
          <span className="skills-drawer__mono">
            {entry.source}
            {entry.ref ? ` @ ${entry.ref}` : ""}
          </span>
        )}
        {kind === undefined && (
          <span className="pf-v6-u-color-200">
            {t("agentic.skills.memberNoReference")}
          </span>
        )}
      </div>
      {kind !== "skillCardRef" && entry.subPath && (
        <div className="pf-v6-u-color-200">
          <Content component="small">
            {t("terms.path")}:{" "}
            <span className="skills-drawer__mono">{entry.subPath}</span>
          </Content>
        </div>
      )}
    </div>
  );
};

export default SkillCollectionDetailDrawer;
