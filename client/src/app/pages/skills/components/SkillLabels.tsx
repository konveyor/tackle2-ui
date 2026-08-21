import React from "react";
import { useTranslation } from "react-i18next";
import { Label, Tooltip } from "@patternfly/react-core";

import type {
  SkillCard,
  SkillCardSpec,
  SkillCardType,
} from "@app/api/agentic/contract";
import { truncate } from "@app/utils/agentic";
import { skillSourceKind } from "@app/utils/skills";

/**
 * Load policy as a label: rule (orange) = injected into every prompt, skill
 * (blue) = listed by name/description and loaded on demand. The tooltip
 * carries the one-sentence explanation so tables and forms stay terse.
 */
export function SkillTypeLabel({
  type,
  isCompact,
}: {
  type?: SkillCardType;
  isCompact?: boolean;
}) {
  const { t } = useTranslation();
  const isRule = type === "rule";
  return (
    <Tooltip
      content={t(
        isRule ? "agentic.skills.typeRuleHelp" : "agentic.skills.typeSkillHelp"
      )}
    >
      <Label color={isRule ? "orange" : "blue"} isCompact={isCompact}>
        {t(isRule ? "agentic.skills.typeRule" : "agentic.skills.typeSkill")}
      </Label>
    </Tooltip>
  );
}

/**
 * Where a card's content comes from: "image" | "git" | "inline", followed by
 * the sub-path and (git) the ref when set. The tooltip holds the full
 * reference plus the controller's delivery mode / resolved image when the
 * status reports them (post-#157 controllers only).
 */
export function SkillSourceLabel({
  spec,
  status,
  isCompact,
}: {
  spec: SkillCardSpec;
  status?: SkillCard["status"];
  isCompact?: boolean;
}) {
  const { t } = useTranslation();
  const kind = skillSourceKind(spec);
  if (!kind) return <>-</>;

  const kindText = t(
    kind === "image"
      ? "agentic.skills.sourceImage"
      : kind === "source"
        ? "agentic.skills.sourceGit"
        : "agentic.skills.sourceInline"
  );
  let text = kindText;
  if (kind !== "inline" && spec.subPath) text += ` · ${spec.subPath}`;
  if (kind === "source" && spec.ref) text += ` @ ${spec.ref}`;

  const reference =
    kind === "image"
      ? spec.image
      : kind === "source"
        ? `${spec.source}${spec.ref ? ` @ ${spec.ref}` : ""}`
        : kindText;
  const lines: string[] = [reference ?? kindText];
  if (kind !== "inline" && spec.subPath)
    lines.push(`${t("terms.path")}: ${spec.subPath}`);
  if (status?.deliveryMode)
    lines.push(`${t("agentic.skills.deliveryMode")}: ${status.deliveryMode}`);
  if (status?.resolvedImage)
    lines.push(`${t("agentic.skills.resolvedImage")}: ${status.resolvedImage}`);

  return (
    <Tooltip
      content={
        <div style={{ wordBreak: "break-all" }}>
          {lines.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
      }
    >
      <Label variant="outline" isCompact={isCompact}>
        {text}
      </Label>
    </Tooltip>
  );
}

/** Description truncated to `max` characters with the full text on hover; "-" when empty. */
export function SkillDescription({
  text,
  max = 80,
}: {
  text?: string;
  max?: number;
}) {
  const value = text?.trim();
  if (!value) return <>-</>;
  if (value.length <= max) return <span>{value}</span>;
  return (
    <Tooltip content={value}>
      <span>{truncate(value, max)}</span>
    </Tooltip>
  );
}
