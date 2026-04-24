/**
 * label-projection.ts
 *
 * Pure functions — no API calls, no side effects.
 * Given the current project field values for an issue and its current labels,
 * computes exactly which labels need to be added or removed.
 *
 * This module is designed to be importable from both the CLI check script and
 * a future GitHub Actions workflow (e.g. via actions/github-script).
 */

import {
  FIELD_NAMES,
  MANAGED_LABEL_PREFIXES,
  NEEDS_LABELS,
  PRIORITY_LABEL_MAP,
  STATUS_TRIAGE_MAP,
  normalizeFieldValue,
} from "./mappings";

// ── Types ────────────────────────────────────────────────────────────────────

/** The subset of project field values relevant to label sync. */
export interface ProjectItemFields {
  /** Value of the project "Status" field, e.g. "In Progress". */
  status?: string;
  /** Value of the project "Priority" field, e.g. "Major". */
  priority?: string;
}

/** The set of label changes needed to bring an issue into sync. */
export interface LabelDiff {
  toAdd: string[];
  toRemove: string[];
}

/**
 * A warning produced when a field value has no entry in the mapping tables.
 * The `needs-*` default label for that family is applied in this case.
 */
export interface MappingWarning {
  field: "status" | "priority" | "kind";
  value: string;
  message: string;
}

/** Full result from computeLabelDiff. */
export interface LabelDiffResult {
  diff: LabelDiff;
  warnings: MappingWarning[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** The complete set of needs-* labels this tool manages. */
const NEEDS_LABEL_SET = new Set<string>(Object.values(NEEDS_LABELS));

/**
 * Returns true if the label belongs to one of the managed families —
 * either a prefixed label (triage/*, priority/*, kind/*) or a needs-* label.
 */
function isManaged(label: string): boolean {
  return (
    MANAGED_LABEL_PREFIXES.some((prefix) => label.startsWith(prefix)) ||
    NEEDS_LABEL_SET.has(label)
  );
}

/** Returns all labels from `currentLabels` that start with `prefix`. */
function labelsWithPrefix(currentLabels: string[], prefix: string): string[] {
  return currentLabels.filter((l) => l.startsWith(prefix));
}

// ── Core computation ──────────────────────────────────────────────────────────

/**
 * Compute the label additions and removals needed so that the issue's labels
 * reflect the given project field values.
 *
 * Managed labels (triage/*, priority/*, and the needs-* defaults) are the only
 * ones ever added or removed.  kind/* labels and all other labels are untouched
 * since the project has no Kind field — those labels are managed via issue type
 * or direct labelling.
 *
 * When a field has no value (undefined) or its value is not in the mapping
 * table, the corresponding `NEEDS_LABELS` default is applied:
 *   - status undefined/unmapped   → needs-triage
 *   - priority undefined/unmapped → needs-priority
 *
 * @param fields        Current project field values for the issue.
 * @param currentLabels All labels currently on the issue.
 * @returns The diff to apply and any warnings about unmapped field values.
 */
export function computeLabelDiff(
  fields: ProjectItemFields,
  currentLabels: string[]
): LabelDiffResult {
  const toAdd: string[] = [];
  const toRemove: string[] = [];
  const warnings: MappingWarning[] = [];

  // ── Status → triage/* or needs-triage ──────────────────────────────────
  {
    let expectedLabel: string = NEEDS_LABELS.triage; // default when unset or unmapped

    if (fields.status !== undefined) {
      const normalized = normalizeFieldValue(fields.status);
      if (Object.prototype.hasOwnProperty.call(STATUS_TRIAGE_MAP, normalized)) {
        expectedLabel = STATUS_TRIAGE_MAP[normalized];
      } else {
        warnings.push({
          field: "status",
          value: fields.status,
          message:
            `"${fields.status}" (normalized: "${normalized}") is not in ` +
            `${FIELD_NAMES.status} mapping (STATUS_TRIAGE_MAP). ` +
            `Defaulting to "${NEEDS_LABELS.triage}".`,
        });
      }
    }

    if (expectedLabel.startsWith("triage/")) {
      // Accepted — ensure the correct triage/* label, remove needs-triage
      if (!currentLabels.includes(expectedLabel)) toAdd.push(expectedLabel);
      for (const l of labelsWithPrefix(currentLabels, "triage/")) {
        if (l !== expectedLabel) toRemove.push(l);
      }
      if (currentLabels.includes(NEEDS_LABELS.triage))
        toRemove.push(NEEDS_LABELS.triage);
    } else {
      // Not yet accepted — ensure needs-triage, remove any triage/* labels
      if (!currentLabels.includes(NEEDS_LABELS.triage))
        toAdd.push(NEEDS_LABELS.triage);
      for (const l of labelsWithPrefix(currentLabels, "triage/"))
        toRemove.push(l);
    }
  }

  // ── Priority → priority/* or needs-priority ────────────────────────────
  {
    let expectedLabel: string = NEEDS_LABELS.priority; // default when unset or unmapped

    if (fields.priority !== undefined) {
      const normalized = normalizeFieldValue(fields.priority);
      if (
        Object.prototype.hasOwnProperty.call(PRIORITY_LABEL_MAP, normalized)
      ) {
        expectedLabel = PRIORITY_LABEL_MAP[normalized];
      } else {
        warnings.push({
          field: "priority",
          value: fields.priority,
          message:
            `"${fields.priority}" (normalized: "${normalized}") is not in ` +
            `${FIELD_NAMES.priority} mapping (PRIORITY_LABEL_MAP). ` +
            `Defaulting to "${NEEDS_LABELS.priority}".`,
        });
      }
    }

    if (expectedLabel.startsWith("priority/")) {
      if (!currentLabels.includes(expectedLabel)) toAdd.push(expectedLabel);
      for (const l of labelsWithPrefix(currentLabels, "priority/")) {
        if (l !== expectedLabel) toRemove.push(l);
      }
      if (currentLabels.includes(NEEDS_LABELS.priority))
        toRemove.push(NEEDS_LABELS.priority);
    } else {
      if (!currentLabels.includes(NEEDS_LABELS.priority))
        toAdd.push(NEEDS_LABELS.priority);
      for (const l of labelsWithPrefix(currentLabels, "priority/"))
        toRemove.push(l);
    }
  }

  // Deduplicate (a label can't be both added and removed)
  const toRemoveSet = new Set(toRemove.filter((l) => !toAdd.includes(l)));

  return {
    diff: {
      toAdd: [...new Set(toAdd)],
      toRemove: [...toRemoveSet],
    },
    warnings,
  };
}

/**
 * Returns true if the diff has no changes to make.
 */
export function isNoop(diff: LabelDiff): boolean {
  return diff.toAdd.length === 0 && diff.toRemove.length === 0;
}

/**
 * Returns a human-readable summary of the managed labels on an issue —
 * useful for reporting which labels are currently set vs. expected.
 */
export function summarizeManagedLabels(currentLabels: string[]): string {
  const managed = currentLabels.filter(isManaged);
  if (managed.length === 0) return "(none)";
  return managed.join(", ");
}
