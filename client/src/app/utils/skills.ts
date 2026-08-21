/**
 * Skill helpers shared by the skills pages, the agent designer and the run
 * surfaces. Browser-safe; no YAML dependency — the frontmatter reader is a
 * small hand parser that mirrors upstream agentic-controller
 * `api/skill/frontmatter.go` (fences, allowed fields, limits, trimming) for
 * the subset of YAML a SKILL.md header actually uses.
 */

import type { Condition, SkillCardSpec } from "@app/api/agentic/contract";

// ------------------------------------------------------------- conditions

/** The `Ready` condition of a SkillCard / SkillCollection / Agent, if any. */
export function readyCondition(
  conditions?: Condition[]
): Condition | undefined {
  return conditions?.find((c) => c.type === "Ready");
}

// ----------------------------------------------------------------- source

/** Which of the exactly-one-of source fields a SkillCard spec sets. */
export type SkillSourceKind = "image" | "source" | "inline";

export function skillSourceKind(
  spec: SkillCardSpec
): SkillSourceKind | undefined {
  if (spec.image) return "image";
  if (spec.source) return "source";
  if (spec.inline) return "inline";
  return undefined;
}

// ------------------------------------------------------------- spec limits

/**
 * Agent Skills naming rule: lowercase letters, digits and single hyphens, no
 * leading/trailing hyphen. Length (≤ 64 code points) is checked separately.
 */
export const SKILL_NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const SKILL_NAME_MAX_LENGTH = 64;
export const SKILL_DESCRIPTION_MAX_LENGTH = 1024;

/** The spec's closed set of top-level frontmatter keys. */
export const SKILL_FRONTMATTER_ALLOWED_FIELDS: readonly string[] = [
  "name",
  "description",
  "license",
  "compatibility",
  "metadata",
  "allowed-tools",
];

/** Code points, not UTF-16 units — the spec (and the controller) count characters. */
const charCount = (s: string): number => Array.from(s).length;

// ------------------------------------------------------------ frontmatter

export interface SkillFrontmatter {
  name?: string;
  description?: string;
  /** Top-level keys outside the spec's allowed set, sorted. */
  extra: string[];
  /** Top-level keys whose plain value yaml.v3 would reject; the controller's Parse fails wholesale on these. */
  invalid: string[];
}

export type ParsedSkillMarkdown =
  | { ok: true; frontmatter: SkillFrontmatter; body: string }
  | { ok: false; error: "noFrontmatter" | "unterminatedFrontmatter" };

const FENCE = "---";
const BOM = "﻿";

/** A fence line is exactly `---`; trailing spaces/tabs/CR are tolerated. */
const isFence = (line: string): boolean =>
  line.replace(/[ \t\r]+$/, "") === FENCE;

type FrontmatterSplit =
  | { kind: "ok"; yaml: string; body: string }
  | { kind: "noFrontmatter" | "unterminatedFrontmatter" };

/**
 * Cut the `---` … `---` header off a SKILL.md. The opening fence must be the
 * very first line (after an optional BOM); the closing fence is the next line
 * that is only `---`, so a `---` inside a quoted value does not end the block.
 */
function splitFrontmatter(md: string): FrontmatterSplit {
  const content = md.startsWith(BOM) ? md.slice(BOM.length) : md;
  const nl = content.indexOf("\n");
  if (nl < 0 || !isFence(content.slice(0, nl)))
    return { kind: "noFrontmatter" };
  const lines = content.slice(nl + 1).split("\n");
  const close = lines.findIndex(isFence);
  if (close < 0) return { kind: "unterminatedFrontmatter" };
  return {
    kind: "ok",
    yaml: lines.slice(0, close).join("\n"),
    // Drop the whole closing-fence line, then any blank lines before the body.
    body: lines
      .slice(close + 1)
      .join("\n")
      .replace(/^[\r\n]+/, ""),
  };
}

const isBlankOrComment = (line: string): boolean => {
  const t = line.trim();
  return t === "" || t.startsWith("#");
};
const isIndented = (line: string): boolean => /^[ \t]/.test(line);

/** Strip a trailing ` # comment` from a plain (unquoted) scalar. */
const stripPlainComment = (value: string): string =>
  value.replace(/\s+#.*$/, "").trim();

/** ': ', ':\t' or a trailing ':' inside a plain scalar — yaml.v3: "mapping values are not allowed in this context". */
const MAPPING_INDICATOR = /:(?:[ \t]|$)/;

/**
 * Read a quoted scalar whose opening quote is at `text[0]`. Returns the value
 * and whether a closing quote was found (a multi-line quoted scalar continues
 * on the following lines until it is).
 */
function readQuoted(
  text: string,
  quote: '"' | "'"
): { value: string; closed: boolean } {
  let out = "";
  for (let i = 1; i < text.length; i++) {
    const ch = text[i];
    if (quote === '"' && ch === "\\" && i + 1 < text.length) {
      const next = text[++i];
      out += next === "n" ? "\n" : next === "t" ? "\t" : next;
      continue;
    }
    if (ch === quote) {
      if (quote === "'" && text[i + 1] === "'") {
        out += "'";
        i++;
        continue;
      }
      return { value: out, closed: true };
    }
    out += ch;
  }
  return { value: out, closed: false };
}

/**
 * Parse the YAML header as a flat mapping of top-level `key: value` pairs.
 * Supported values: plain scalars (with indented continuation lines folded
 * in), single/double-quoted scalars, and `>` / `|` block scalars with optional
 * chomping indicators. A key with no inline value followed by indented lines
 * (e.g. `metadata:`) is a nested node: recorded as present, contents ignored.
 * Anything else is skipped rather than rejected — the controller is the
 * authority, this is a preview.
 */
function parseYamlMapping(yaml: string): {
  values: Map<string, string>;
  invalid: string[];
} {
  const values = new Map<string, string>();
  const invalid: string[] = [];
  const rawLines = yaml.split("\n").map((l) => l.replace(/\r$/, ""));
  // A root mapping may sit at a uniform indent (valid YAML; yaml.v3 accepts
  // it). Strip the common indentation so its keys read as top-level.
  const indentOf = (l: string): number => l.length - l.trimStart().length;
  const base = Math.min(
    ...rawLines.filter((l) => !isBlankOrComment(l)).map(indentOf)
  );
  const lines =
    Number.isFinite(base) && base > 0
      ? rawLines.map((l) => l.slice(Math.min(base, indentOf(l))))
      : rawLines;
  let i = 0;

  /** Consume the indented (or blank) lines that belong to the current key. */
  const takeIndented = (): string[] => {
    const taken: string[] = [];
    while (i < lines.length && (isIndented(lines[i]) || lines[i].trim() === ""))
      taken.push(lines[i++]);
    // Trailing blank lines belong to the gap before the next key, not the value.
    while (taken.length && taken[taken.length - 1].trim() === "") taken.pop();
    return taken;
  };

  while (i < lines.length) {
    const line = lines[i++];
    if (isBlankOrComment(line) || isIndented(line)) continue;
    const m = /^([^\s#:][^:]*?)[ \t]*:(?:[ \t]+(.*))?$/.exec(line);
    if (!m) continue;
    const key = m[1].trim();
    const raw = (m[2] ?? "").trim();

    if (raw === "" || raw.startsWith("#")) {
      // `key:` — nested mapping/sequence (or genuinely empty). Ignore contents.
      takeIndented();
      values.set(key, "");
    } else if (/^[>|][+-]?\d?[+-]?([ \t]+#.*)?$/.test(raw)) {
      // Block scalar. Strip the block's own indentation (that of its first
      // non-blank line); folded joins lines with spaces (blank line = newline),
      // literal keeps the newlines. Chomping only affects trailing newlines,
      // which the trim below removes anyway.
      const block = takeIndented();
      const first = block.find((l) => l.trim() !== "") ?? "";
      const indent = first.length - first.trimStart().length;
      const body = block.map((l) =>
        l.trim() === ""
          ? ""
          : l.slice(Math.min(indent, l.length - l.trimStart().length))
      );
      values.set(
        key,
        raw.startsWith(">")
          ? body
              .map((l) => (l === "" ? "\n" : l))
              .join(" ")
              .replace(/ ?\n ?/g, "\n")
              .trim()
          : body.join("\n").trim()
      );
    } else if (raw.startsWith('"') || raw.startsWith("'")) {
      const quote = raw[0] as '"' | "'";
      let text = raw;
      let parsed = readQuoted(text, quote);
      // Multi-line quoted scalar: keep appending lines until the quote closes.
      while (!parsed.closed && i < lines.length) {
        text += " " + lines[i++].trim();
        parsed = readQuoted(text, quote);
      }
      values.set(key, parsed.value);
    } else {
      // Plain scalar; indented continuation lines fold in with spaces.
      const continuation = takeIndented()
        .map(stripPlainComment)
        .filter((l) => l !== "");
      const parts = [stripPlainComment(raw), ...continuation];
      if (parts.some((p) => MAPPING_INDICATOR.test(p))) invalid.push(key);
      values.set(key, parts.join(" "));
    }
  }
  return { values, invalid };
}

/**
 * Parse a SKILL.md into its frontmatter (name, description, unexpected keys)
 * and body. Name and description are trimmed, as the controller does — a
 * folded scalar keeps a trailing newline that must not reach the agent's
 * skill listing.
 */
export function parseSkillFrontmatter(md: string): ParsedSkillMarkdown {
  const split = splitFrontmatter(md);
  if (split.kind !== "ok") return { ok: false, error: split.kind };
  const { values: mapping, invalid } = parseYamlMapping(split.yaml);
  const extra = [...mapping.keys()]
    .filter((k) => !SKILL_FRONTMATTER_ALLOWED_FIELDS.includes(k))
    .sort();
  const pick = (k: string) => {
    const v = mapping.get(k)?.trim();
    return v ? v : undefined;
  };
  return {
    ok: true,
    frontmatter: {
      name: pick("name"),
      description: pick("description"),
      extra,
      invalid,
    },
    body: split.body,
  };
}

/** Markdown without its YAML header; content with no (or unclosed) header is returned unchanged. */
export function skillBody(md: string): string {
  const split = splitFrontmatter(md);
  return split.kind === "ok" ? split.body : md;
}

// ------------------------------------------------------------- validation

/**
 * Issue codes render as `t(\`agentic.skills.validation.${code}\`, params)`.
 * `validateSkillMarkdown` never emits `nameDiffersFromCard`; callers that know
 * the card name add it themselves (as a warning).
 */
export type SkillValidationCode =
  | "noFrontmatter"
  | "unterminatedFrontmatter"
  | "noName"
  | "noDescription"
  | "descriptionTooLong"
  | "nameInvalid"
  | "nameTooLong"
  | "unexpectedFields"
  | "invalidYaml"
  | "emptyBody"
  | "nameDiffersFromCard";

export interface SkillValidationIssue {
  code: SkillValidationCode;
  params?: Record<string, string | number>;
}

export interface SkillMarkdownValidation {
  /** Absent when the header could not be cut off at all. */
  frontmatter?: SkillFrontmatter;
  /** Block saving: the controller would mark the card InvalidSkillContent. */
  errors: SkillValidationIssue[];
  /** Worth a look, but the controller accepts the content. */
  warnings: SkillValidationIssue[];
}

/**
 * The controller's checks (upstream `Frontmatter.Validate` + `ValidName`),
 * reported all at once instead of first-failure so the editor can show them
 * together. `emptyBody` is a warning: the spec does not require a body.
 */
export function validateSkillMarkdown(md: string): SkillMarkdownValidation {
  const parsed = parseSkillFrontmatter(md);
  if (!parsed.ok) return { errors: [{ code: parsed.error }], warnings: [] };

  const { frontmatter, body } = parsed;
  const errors: SkillValidationIssue[] = [];
  const warnings: SkillValidationIssue[] = [];
  const { name, description } = frontmatter;

  if (!name) errors.push({ code: "noName" });
  if (!description) errors.push({ code: "noDescription" });
  else if (charCount(description) > SKILL_DESCRIPTION_MAX_LENGTH)
    errors.push({
      code: "descriptionTooLong",
      params: { count: charCount(description) },
    });
  if (name) {
    if (charCount(name) > SKILL_NAME_MAX_LENGTH)
      errors.push({ code: "nameTooLong", params: { count: charCount(name) } });
    if (!SKILL_NAME_PATTERN.test(name))
      errors.push({ code: "nameInvalid", params: { name } });
  }
  if (frontmatter.extra.length > 0)
    errors.push({
      code: "unexpectedFields",
      params: { fields: frontmatter.extra.join(", ") },
    });
  if (frontmatter.invalid.length > 0)
    errors.push({
      code: "invalidYaml",
      params: { fields: frontmatter.invalid.join(", ") },
    });
  if (body.trim() === "") warnings.push({ code: "emptyBody" });

  return { frontmatter, errors, warnings };
}

// --------------------------------------------------------------- template

/** Characters that make a plain YAML scalar ambiguous; quote when present. */
const PLAIN_SCALAR_UNSAFE = /^[-?:,[\]{}#&*!|>'"%@`\s]|: |\s#|[\n\r]|\s$/;

/** Render a string as a YAML scalar: plain when unambiguous, else double-quoted (JSON is valid YAML). */
const yamlScalar = (value: string): string =>
  value === "" || PLAIN_SCALAR_UNSAFE.test(value)
    ? JSON.stringify(value)
    : value;

const DEFAULT_BODY = `## When to use

Describe the situations in which the agent should load this skill.

## Instructions

1. First step.
2. Second step.`;

/** A starter SKILL.md: valid frontmatter plus a titled body skeleton. */
export function buildSkillMarkdown(input: {
  name: string;
  description: string;
  title?: string;
  body?: string;
}): string {
  const title = (input.title ?? input.name).trim() || input.name;
  const body = (input.body ?? DEFAULT_BODY).trim();
  return [
    FENCE,
    `name: ${yamlScalar(input.name.trim())}`,
    `description: ${yamlScalar(input.description.trim())}`,
    FENCE,
    "",
    `# ${title}`,
    "",
    body,
    "",
  ].join("\n");
}
