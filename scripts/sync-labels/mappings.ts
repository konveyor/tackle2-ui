/**
 * mappings.ts
 *
 * Authoritative mapping tables between GitHub Projects V2 field option names
 * and the corresponding GitHub issue labels used in this repo.
 *
 * These maps are the single source of truth for both the CLI check script and
 * any future workflow that syncs project fields ↔ labels.  Update them here
 * whenever a new project field option or label is added.
 *
 * Key = exact string as it appears in the GitHub Project UI field option.
 * Value = exact label name as it appears on GitHub issues.
 */

/**
 * Project "Status" field option → expected triage/* label.
 *
 * When the status is "New" (not yet triaged) the issue should carry
 * `needs-triage`.  For all other mapped statuses the issue is considered
 * accepted and should carry `triage/accepted`.
 * Any status option not present in this map is treated as unmapped and will
 * receive the `NEEDS_LABELS.triage` default.
 */
export const STATUS_TRIAGE_MAP: Record<string, string> = {
  New: "needs-triage",
  Backlog: "triage/accepted",
  Ready: "triage/accepted",
  "In progress": "triage/accepted",
  Testing: "triage/accepted",
  Done: "triage/accepted",
  Verified: "triage/accepted",
};

/**
 * Project "Priority" field option → priority/* label.
 *
 * These match the priority dropdown options defined in the bug issue template.
 */
export const PRIORITY_LABEL_MAP: Record<string, string> = {
  Blocker: "priority/blocker",
  Urgent: "priority/critical",
  High: "priority/major",
  Medium: "priority/normal",
  Low: "priority/minor",
};

/**
 * Project "Kind" (or "Type") field option → kind/* label.
 *
 * NOTE: The planning project does not have a Kind/Type field.  Kind labels
 * are managed via the issue's type or by direct labelling and are not synced
 * by this tool.  This map is kept for reference only and is not used.
 */
// export const KIND_LABEL_MAP: Record<string, string> = { ... };

/**
 * The set of label prefixes managed by this sync tool.
 * Only labels whose names start with one of these prefixes are ever added or
 * removed — all other labels on an issue are left untouched.
 *
 * kind/* labels are intentionally excluded: the project has no Kind field, so
 * kind labels are set via issue type or direct labelling and not touched here.
 */
export const MANAGED_LABEL_PREFIXES = ["triage/", "priority/"] as const;

/**
 * Default "needs-*" label applied to each managed family when the
 * corresponding project field has no value or an unmapped value.
 *
 * These are paired with the three mapping tables:
 *   STATUS_TRIAGE_MAP  → NEEDS_LABELS.triage   ("needs-triage")
 *   PRIORITY_LABEL_MAP → NEEDS_LABELS.priority  ("needs-priority")
 *   KIND_LABEL_MAP     → NEEDS_LABELS.kind       ("needs-kind")
 */
export const NEEDS_LABELS = {
  triage: "needs-triage",
  priority: "needs-priority",
} as const;

/**
 * Project field names to look for in the fieldValues response.
 * Must match the exact field name strings in the GitHub Project.
 */
export const FIELD_NAMES = {
  status: "Status",
  priority: "Priority",
} as const;

/**
 * Strip leading emoji characters and surrounding whitespace from a project
 * field option value before looking it up in a mapping table.
 *
 * GitHub Projects often prefixes option names with an emoji in the UI
 * (e.g. "🐛 Bug", "🔥 Critical", "🔄 In Progress").  The mapping keys are
 * defined without emoji so that adding or reordering decorators in the project
 * UI doesn't require changes here.
 *
 * Uses the Unicode `Extended_Pictographic` property which covers emoji
 * pictographs without accidentally matching digits (unlike `\p{Emoji}`).
 */
export function normalizeFieldValue(value: string): string {
  return value
    .replace(
      // eslint-disable-next-line no-misleading-character-class
      /^[\p{Extended_Pictographic}\u{FE0F}\u{20E3}\u{1F3FB}-\u{1F3FF}\s]+/u,
      ""
    )
    .trim();
}
