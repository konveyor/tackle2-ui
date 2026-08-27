import React from "react";
import { useTranslation } from "react-i18next";
import { Label, Tooltip } from "@patternfly/react-core";

import type {
  Condition,
  SkillCard,
  SkillCardSpec,
  SkillCardType,
} from "@app/api/agentic/contract";
import { truncate } from "@app/utils/agentic";
import { resolvableCondition, skillSourceKind } from "@app/utils/skills";

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

/**
 * Whether an image card's referenced artifact actually exists, from the
 * best-effort Resolvable condition (agentic-controller#188): Present (green),
 * Missing (red — a run would ImagePullBackOff) or Unverified (orange — the
 * controller could not confirm, e.g. a private registry). Renders nothing when
 * the condition is absent (older controllers, non-image cards). Pass
 * `omitPresent` to also render nothing for a verified-present artifact — used in
 * the list, where a green Ready already says enough and only problems warrant a
 * second label. The reason and message show on hover, so the registry's own
 * words reach the operator.
 */
export function ResolvableLabel({
  conditions,
  isCompact,
  omitPresent,
}: {
  conditions?: Condition[];
  isCompact?: boolean;
  omitPresent?: boolean;
}) {
  const { t } = useTranslation();
  const c = resolvableCondition(conditions);
  if (!c) return null;
  if (omitPresent && c.status === "True") return null;

  const { color, text } =
    c.status === "True"
      ? { color: "green" as const, text: t("agentic.skills.resolvablePresent") }
      : c.status === "False"
        ? { color: "red" as const, text: t("agentic.skills.resolvableMissing") }
        : {
            color: "orange" as const,
            text: t("agentic.skills.resolvableUnknown"),
          };

  const label = (
    <Label color={color} isCompact={isCompact}>
      {text}
    </Label>
  );
  if (!c.reason && !c.message) return label;
  return (
    <Tooltip
      content={
        <div style={{ wordBreak: "break-word" }}>
          {c.reason && <div>{c.reason}</div>}
          {c.message && (
            <div style={{ whiteSpace: "pre-wrap" }}>{c.message}</div>
          )}
        </div>
      }
    >
      {label}
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
