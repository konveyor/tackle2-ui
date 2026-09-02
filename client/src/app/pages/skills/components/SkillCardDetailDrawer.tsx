import "../skills.css";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  CodeBlock,
  CodeBlockCode,
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  HelperText,
  HelperTextItem,
  Label,
  LabelGroup,
  Title,
  Tooltip,
} from "@patternfly/react-core";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import type {
  AgentResource,
  Condition,
  SkillCard,
  SkillCollection,
} from "@app/api/agentic/contract";
import { SKILL_COLLECTION_LABEL } from "@app/api/agentic/contract";
import { PageDrawerContent } from "@app/components/PageDrawerContext";
import {
  DrawerTabContent,
  DrawerTabContentSection,
  DrawerTabsContainer,
  NoEntitySelected,
} from "@app/components/detail-drawer";
import { ReadyLabel } from "@app/pages/agent-runs/components/ReadyLabel";
import {
  type SkillValidationIssue,
  readyCondition,
  resolvableCondition,
  skillSourceKind,
  validateSkillMarkdown,
} from "@app/utils/skills";

import {
  ResolvableLabel,
  SkillSourceLabel,
  SkillTypeLabel,
} from "./SkillLabels";

// ------------------------------------------------------------ shared bits
// Also used by SkillCollectionDetailDrawer so the two drawers read alike.

/** A compact horizontal DescriptionList sized for the 500px drawer. */
export const DrawerFieldList: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <DescriptionList
    isCompact
    isHorizontal
    horizontalTermWidthModifier={{ default: "14ch" }}
  >
    {children}
  </DescriptionList>
);

export const DrawerField: React.FC<{
  term: string;
  children: React.ReactNode;
}> = ({ term, children }) => (
  <DescriptionListGroup>
    <DescriptionListTerm>{term}</DescriptionListTerm>
    <DescriptionListDescription>{children}</DescriptionListDescription>
  </DescriptionListGroup>
);

/** Small grey explanatory line under a value. */
export const DrawerHint: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <div className="skills-drawer__hint pf-v6-u-color-200">
    <Content component="small">{children}</Content>
  </div>
);

/** Every condition in full: type · status · reason, then the message. */
export const ConditionsList: React.FC<{ conditions?: Condition[] }> = ({
  conditions,
}) => {
  const { t } = useTranslation();
  if (!conditions?.length) {
    return (
      <span className="pf-v6-u-color-200">
        {t("agentic.skills.noConditions")}
      </span>
    );
  }
  return (
    <ul className="skills-drawer__conditions">
      {conditions.map((c, i) => (
        <li key={`${c.type}-${i}`} className="skills-drawer__condition">
          <div>
            <strong>{c.type}</strong> · {c.status}
            {c.reason ? ` · ${c.reason}` : ""}
          </div>
          {c.message && (
            <div className="skills-drawer__condition-message pf-v6-u-color-200">
              <Content component="small">{c.message}</Content>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
};

/** Agent names as labels; "None" when empty. */
export const AgentLabels: React.FC<{
  agents: AgentResource[];
  /** Agents that reach the object indirectly, with what they go through. */
  indirect?: { agent: AgentResource; via: string[] }[];
}> = ({ agents, indirect = [] }) => {
  const { t } = useTranslation();
  if (agents.length === 0 && indirect.length === 0)
    return <>{t("terms.none")}</>;
  return (
    <LabelGroup numLabels={10}>
      {agents.map((a) => (
        <Label key={a.metadata.name} color="blue" isCompact>
          {a.metadata.name}
        </Label>
      ))}
      {indirect.map(({ agent, via }) => (
        <Tooltip
          key={agent.metadata.name}
          content={t("agentic.skills.viaCollection", { name: via.join(", ") })}
        >
          <Label variant="outline" isCompact>
            {agent.metadata.name}
          </Label>
        </Tooltip>
      ))}
    </LabelGroup>
  );
};

// ------------------------------------------------------------- references

interface CardReferences {
  /** Agents listing the card in spec.skillCards. */
  directAgents: AgentResource[];
  /** Collections holding the card: an explicit skillCardRef entry, or the
   *  controller's ownership label on a card it enumerated from an image. */
  collections: SkillCollection[];
  /** Agents reaching the card only through one of those collections. */
  viaCollectionAgents: { agent: AgentResource; via: string[] }[];
}

function cardReferences(
  card: SkillCard,
  agents: AgentResource[],
  collections: SkillCollection[]
): CardReferences {
  const name = card.metadata.name ?? "";
  const owner = card.metadata.labels?.[SKILL_COLLECTION_LABEL];
  const containing = collections.filter(
    (c) =>
      c.spec.skills?.some((s) => s.skillCardRef === name) ||
      (!!owner && c.metadata.name === owner)
  );
  const containingNames = new Set(containing.map((c) => c.metadata.name));

  const directAgents = agents.filter((a) =>
    a.spec.skillCards?.some((r) => r.ref === name)
  );
  const directNames = new Set(directAgents.map((a) => a.metadata.name));

  const viaCollectionAgents = agents.flatMap((agent) => {
    if (directNames.has(agent.metadata.name)) return [];
    const via = (agent.spec.skillCollections ?? [])
      .map((r) => r.ref)
      .filter((ref) => containingNames.has(ref));
    return via.length ? [{ agent, via }] : [];
  });

  return { directAgents, collections: containing, viaCollectionAgents };
}

// ------------------------------------------------------------------ drawer

interface SkillCardDetailDrawerProps {
  card: SkillCard | null;
  onCloseClick: () => void;
  agents: AgentResource[];
  skillCollections: SkillCollection[];
  /** Hop to a collection's drawer from the "Referenced by" labels. */
  onViewCollection?: (name: string) => void;
}

export const SkillCardDetailDrawer: React.FC<SkillCardDetailDrawerProps> = ({
  card,
  onCloseClick,
  agents,
  skillCollections,
  onViewCollection,
}) => {
  const { t } = useTranslation();

  return (
    <PageDrawerContent
      isExpanded={!!card}
      onCloseClick={onCloseClick}
      pageKey="skill-card-details"
      header={
        <Content>
          <Content component="small" className={spacing.mb_0}>
            {t("agentic.skills.skillCardDetails")}
          </Content>
          <Title headingLevel="h2" size="lg" className={spacing.mtXs}>
            {card
              ? (card.metadata.name ?? "")
              : t("agentic.skills.noSkillCardSelected")}
          </Title>
        </Content>
      }
    >
      {card ? (
        <DrawerTabsContainer>
          <DrawerTabContent>
            <SkillCardDetails
              card={card}
              agents={agents}
              skillCollections={skillCollections}
              onViewCollection={onViewCollection}
            />
          </DrawerTabContent>
        </DrawerTabsContainer>
      ) : (
        <NoEntitySelected entityName={t("terms.skillCard").toLowerCase()} />
      )}
    </PageDrawerContent>
  );
};

const SkillCardDetails: React.FC<{
  card: SkillCard;
  agents: AgentResource[];
  skillCollections: SkillCollection[];
  onViewCollection?: (name: string) => void;
}> = ({ card, agents, skillCollections, onViewCollection }) => {
  const { t } = useTranslation();
  const name = card.metadata.name ?? "";
  const { spec, status } = card;
  const kind = skillSourceKind(spec);
  const isRule = spec.type === "rule";
  const ready = readyCondition(status?.conditions);
  const resolvable = resolvableCondition(status?.conditions);

  const references = useMemo(
    () => cardReferences(card, agents, skillCollections),
    [card, agents, skillCollections]
  );

  // Inline cards: what the controller's validator (and the agent) would see.
  const validation = useMemo(
    () =>
      kind === "inline" && spec.inline
        ? validateSkillMarkdown(spec.inline)
        : undefined,
    [kind, spec.inline]
  );
  const warnings: SkillValidationIssue[] = useMemo(() => {
    if (!validation) return [];
    const fm = validation.frontmatter;
    return fm?.name && fm.name !== name
      ? [
          ...validation.warnings,
          { code: "nameDiffersFromCard", params: { name: fm.name } },
        ]
      : validation.warnings;
  }, [validation, name]);

  const issueText = (issue: SkillValidationIssue) =>
    t(`agentic.skills.validation.${issue.code}`, issue.params ?? {});

  return (
    <>
      <DrawerTabContentSection label={t("terms.details")}>
        <DrawerFieldList>
          <DrawerField term={t("terms.name")}>{name}</DrawerField>
          <DrawerField term={t("terms.displayName")}>
            {spec.displayName ?? "-"}
          </DrawerField>
          <DrawerField term={t("terms.description")}>
            {spec.description?.trim() || "-"}
          </DrawerField>
          <DrawerField term={t("terms.type")}>
            <SkillTypeLabel type={spec.type} />
            <DrawerHint>
              {t(
                isRule
                  ? "agentic.skills.typeRuleHelp"
                  : "agentic.skills.typeSkillHelp"
              )}
            </DrawerHint>
          </DrawerField>
          <DrawerField term={t("terms.source")}>
            <SkillSourceLabel spec={spec} status={status} />
          </DrawerField>
          {kind === "image" && (
            <DrawerField term={t("terms.image")}>
              <span className="skills-drawer__mono">{spec.image}</span>
            </DrawerField>
          )}
          {kind === "source" && (
            <>
              <DrawerField term={t("terms.repository")}>
                <span className="skills-drawer__mono">{spec.source}</span>
              </DrawerField>
              <DrawerField term={t("agentic.skills.ref")}>
                {spec.ref ? (
                  <span className="skills-drawer__mono">{spec.ref}</span>
                ) : (
                  <HelperText>
                    <HelperTextItem variant="warning">
                      {t("agentic.skills.refUnpinnedWarning")}
                    </HelperTextItem>
                  </HelperText>
                )}
              </DrawerField>
            </>
          )}
          {kind !== "inline" && spec.subPath && (
            <DrawerField term={t("terms.path")}>
              <span className="skills-drawer__mono">{spec.subPath}</span>
            </DrawerField>
          )}
          <DrawerField term={t("terms.version")}>
            {spec.version ?? "-"}
          </DrawerField>
          <DrawerField term={t("terms.tags")}>
            {spec.tags?.length ? (
              <LabelGroup numLabels={10}>
                {spec.tags.map((tag) => (
                  <Label key={tag} variant="outline" isCompact>
                    {tag}
                  </Label>
                ))}
              </LabelGroup>
            ) : (
              "-"
            )}
          </DrawerField>
        </DrawerFieldList>
      </DrawerTabContentSection>

      <DrawerTabContentSection label={t("terms.status")}>
        <DrawerFieldList>
          <DrawerField term={t("agentic.skills.ready")}>
            <ReadyLabel conditions={status?.conditions} />
            {kind === "image" && ready?.status === "True" && (
              <DrawerHint>{t("agentic.skills.readyFaceValue")}</DrawerHint>
            )}
          </DrawerField>
          <DrawerField term={t("agentic.skills.deliveryMode")}>
            {status?.deliveryMode ?? "-"}
          </DrawerField>
          {(kind === "image" || status?.resolvedImage) && (
            <DrawerField term={t("agentic.skills.resolvedImage")}>
              {status?.resolvedImage ? (
                <span className="skills-drawer__mono">
                  {status.resolvedImage}
                </span>
              ) : (
                "-"
              )}
            </DrawerField>
          )}
          {kind === "image" && (
            <DrawerField term={t("agentic.skills.resolvable")}>
              {resolvable ? (
                <>
                  <ResolvableLabel conditions={status?.conditions} />
                  <DrawerHint>
                    {t(
                      resolvable.status === "False"
                        ? "agentic.skills.resolvableMissingHint"
                        : resolvable.status === "Unknown"
                          ? "agentic.skills.resolvableUnknownHint"
                          : "agentic.skills.resolvableHint"
                    )}
                  </DrawerHint>
                </>
              ) : (
                <>
                  {"-"}
                  <DrawerHint>
                    {t("agentic.skills.resolvableUnsupported")}
                  </DrawerHint>
                </>
              )}
            </DrawerField>
          )}
          <DrawerField term={t("agentic.skills.conditions")}>
            <ConditionsList conditions={status?.conditions} />
          </DrawerField>
        </DrawerFieldList>
      </DrawerTabContentSection>

      <DrawerTabContentSection label={t("agentic.skills.content")}>
        {kind === "inline" && spec.inline ? (
          <>
            <DrawerHint>{t("agentic.skills.frontmatterSummary")}</DrawerHint>
            <DrawerFieldList>
              <DrawerField term={t("terms.name")}>
                {validation?.frontmatter?.name ?? "-"}
              </DrawerField>
              <DrawerField term={t("terms.description")}>
                {validation?.frontmatter?.description ?? "-"}
              </DrawerField>
            </DrawerFieldList>
            {validation &&
              (validation.errors.length > 0 || warnings.length > 0) && (
                <HelperText className={spacing.mtSm}>
                  {validation.errors.map((issue, i) => (
                    <HelperTextItem key={`error-${i}`} variant="error">
                      {issueText(issue)}
                    </HelperTextItem>
                  ))}
                  {warnings.map((issue, i) => (
                    <HelperTextItem key={`warning-${i}`} variant="warning">
                      {issueText(issue)}
                    </HelperTextItem>
                  ))}
                </HelperText>
              )}
            <CodeBlock className={`skills-drawer__code ${spacing.mtSm}`}>
              <CodeBlockCode>{spec.inline}</CodeBlockCode>
            </CodeBlock>
          </>
        ) : (
          <Content component="p">
            {t("agentic.skills.contentNotReadable", {
              where: t(
                kind === "source" ? "terms.repository" : "terms.image"
              ).toLowerCase(),
            })}
          </Content>
        )}
      </DrawerTabContentSection>

      <DrawerTabContentSection label={t("agentic.skills.referencedBy")}>
        <DrawerFieldList>
          <DrawerField term={t("terms.agents")}>
            <AgentLabels
              agents={references.directAgents}
              indirect={references.viaCollectionAgents}
            />
          </DrawerField>
          <DrawerField term={t("terms.skillCollections")}>
            {references.collections.length === 0 ? (
              t("terms.none")
            ) : (
              <LabelGroup numLabels={10}>
                {references.collections.map((c) => {
                  const collectionName = c.metadata.name ?? "";
                  return (
                    <Label
                      key={collectionName}
                      color="purple"
                      isCompact
                      onClick={
                        onViewCollection
                          ? () => onViewCollection(collectionName)
                          : undefined
                      }
                    >
                      {collectionName}
                    </Label>
                  );
                })}
              </LabelGroup>
            )}
          </DrawerField>
        </DrawerFieldList>
      </DrawerTabContentSection>
    </>
  );
};

export default SkillCardDetailDrawer;
