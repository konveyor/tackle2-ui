import React from "react";
import { useTranslation } from "react-i18next";
import {
  HelperText,
  HelperTextItem,
  Label,
  Tooltip,
} from "@patternfly/react-core";

import type {
  AgentResource,
  SkillCard,
  SkillCollection,
} from "@app/api/agentic/contract";
import { SkillTypeLabel } from "@app/pages/skills/components/SkillLabels";

import "../agent-runs.css";

interface RunSkillsSummaryProps {
  /** The run's Agent; undefined while it resolves or when it is not found. */
  agent?: AgentResource;
  skillCards: SkillCard[];
  skillCollections: SkillCollection[];
  /**
   * `inline`: compact labels for a DescriptionList cell ("-" when empty).
   * `block`: one row per reference with its type / member count, or the
   * no-skills sentence.
   */
  variant: "inline" | "block";
  /**
   * The card/collection lists are still loading or failed to load, so a
   * reference missing from them is not known to be missing: render it
   * without the "not found" claim.
   */
  unresolved?: boolean;
}

type Translate = (key: string, opts?: Record<string, unknown>) => string;

/** Member count (explicit) or enumerate mode, plus the member names for a tooltip. */
function collectionSummary(
  col: SkillCollection,
  t: Translate
): { text: string; members: string[] } {
  if (col.spec.image) {
    const resolved = col.status?.resolvedSkills ?? [];
    const enumerated = t("agentic.createRun.collectionEnumerated");
    return {
      text:
        resolved.length > 0
          ? `${enumerated} · ${t("agentic.createRun.collectionSkills", { count: resolved.length })}`
          : enumerated,
      members: resolved.length > 0 ? resolved : [col.spec.image],
    };
  }
  const skills = col.spec.skills ?? [];
  return {
    text: t("agentic.createRun.collectionSkills", { count: skills.length }),
    members: skills.map((s) => s.name),
  };
}

function Lines({ lines }: { lines: string[] }) {
  return (
    <div style={{ wordBreak: "break-word" }}>
      {lines.map((line, i) => (
        <div key={i}>{line}</div>
      ))}
    </div>
  );
}

/**
 * The skills a run carries: everything its Agent references (AgentRun has no
 * per-run selection). Shared by the create-run modal (block) and the run
 * detail page (inline).
 */
export function RunSkillsSummary({
  agent,
  skillCards,
  skillCollections,
  variant,
  unresolved = false,
}: RunSkillsSummaryProps) {
  const { t } = useTranslation();
  const cardRefs = agent?.spec.skillCards?.map((s) => s.ref) ?? [];
  const collectionRefs = agent?.spec.skillCollections?.map((s) => s.ref) ?? [];

  // Nothing to list: no agent (not resolved / not found) or an agent that
  // references no skills. The cell shows "-"; the form says so in words.
  if (cardRefs.length === 0 && collectionRefs.length === 0) {
    if (variant === "inline") return <>-</>;
    if (!agent) return null;
    return (
      <HelperText>
        <HelperTextItem>{t("agentic.createRun.noSkills")}</HelperTextItem>
      </HelperText>
    );
  }

  const cardByName = new Map(
    skillCards.map((c) => [c.metadata.name ?? "", c] as const)
  );
  const collectionByName = new Map(
    skillCollections.map((c) => [c.metadata.name ?? "", c] as const)
  );

  const typeName = (card: SkillCard) =>
    t(
      card.spec.type === "rule"
        ? "agentic.skills.typeRule"
        : "agentic.skills.typeSkill"
    );

  if (variant === "inline") {
    return (
      <span className="run-skills-inline">
        {cardRefs.map((ref) => {
          const card = cardByName.get(ref);
          if (!card) {
            const label = (
              <Label isCompact color="grey">
                {ref}
              </Label>
            );
            return unresolved ? (
              <React.Fragment key={`card-${ref}`}>{label}</React.Fragment>
            ) : (
              <Tooltip
                key={`card-${ref}`}
                content={t("agentic.createRun.skillCardNotFound", {
                  name: ref,
                })}
              >
                {label}
              </Tooltip>
            );
          }
          const description = card.spec.description?.trim();
          return (
            <Tooltip
              key={`card-${ref}`}
              content={
                <Lines
                  lines={
                    description
                      ? [typeName(card), description]
                      : [typeName(card)]
                  }
                />
              }
            >
              <Label
                isCompact
                color={card.spec.type === "rule" ? "orange" : "blue"}
              >
                {ref}
              </Label>
            </Tooltip>
          );
        })}
        {collectionRefs.map((ref) => {
          const col = collectionByName.get(ref);
          const label = (
            <Label isCompact color="grey">
              {t("agentic.runDetail.collectionLabel", { name: ref })}
            </Label>
          );
          if (!col) {
            return unresolved ? (
              <React.Fragment key={`col-${ref}`}>{label}</React.Fragment>
            ) : (
              <Tooltip
                key={`col-${ref}`}
                content={t("agentic.createRun.skillCollectionNotFound", {
                  name: ref,
                })}
              >
                {label}
              </Tooltip>
            );
          }
          const summary = collectionSummary(col, t);
          return (
            <Tooltip
              key={`col-${ref}`}
              content={<Lines lines={[summary.text, ...summary.members]} />}
            >
              {label}
            </Tooltip>
          );
        })}
      </span>
    );
  }

  const notFound = (
    <Label isCompact color="grey">
      {t("agentic.createRun.skillNotFound")}
    </Label>
  );

  return (
    <div className="run-skills-block">
      {cardRefs.map((ref) => {
        const card = cardByName.get(ref);
        const description = card?.spec.description?.trim();
        const name = <span className="run-skills-name">{ref}</span>;
        return (
          <div key={`card-${ref}`} className="run-skills-row">
            {description ? (
              <Tooltip content={description}>{name}</Tooltip>
            ) : (
              name
            )}
            {card ? (
              <SkillTypeLabel type={card.spec.type} isCompact />
            ) : unresolved ? null : (
              notFound
            )}
          </div>
        );
      })}
      {collectionRefs.map((ref) => {
        const col = collectionByName.get(ref);
        const summary = col ? collectionSummary(col, t) : undefined;
        return (
          <div key={`col-${ref}`} className="run-skills-row">
            <span className="run-skills-name">{ref}</span>
            <Label isCompact variant="outline">
              {t("terms.skillCollection")}
            </Label>
            {summary ? (
              <Tooltip content={<Lines lines={summary.members} />}>
                <Label isCompact variant="outline">
                  {summary.text}
                </Label>
              </Tooltip>
            ) : unresolved ? null : (
              notFound
            )}
          </div>
        );
      })}
    </div>
  );
}
