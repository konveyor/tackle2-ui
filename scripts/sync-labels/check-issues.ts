#!/usr/bin/env node
/**
 * check-issues.ts
 *
 * CLI script that discovers all issues tracked in the Konveyor planning
 * project, compares their project field values (Status, Priority, Kind) to
 * their GitHub labels, and reports where labels need to be added or removed.
 *
 * Usage:
 *   GITHUB_TOKEN=<pat> node --loader ts-node/esm \
 *     --project scripts/sync-labels/tsconfig.json \
 *     scripts/sync-labels/check-issues.ts \
 *     [--org konveyor] [--project-number 67] [--repo tackle2-ui]
 *
 * Or via npm:
 *   GITHUB_TOKEN=<pat> npm run sync-labels:check [-- --repo tackle2-ui]
 *
 * Required environment variables:
 *   GITHUB_TOKEN  — a token with `read:project` and `read:org` scopes
 *
 * Optional CLI flags (all have defaults):
 *   --org            GitHub organization login        (default: konveyor)
 *   --project-number GitHub Project number            (default: 67)
 *   --repo           Filter to a single repo name     (default: tackle2-ui)
 *   --all-repos      Include issues from all repos in the project
 *   --include-closed Include closed issues            (default: open only)
 */

import process from "node:process";

import {
  type LabelDiffResult,
  computeLabelDiff,
  isNoop,
  summarizeManagedLabels,
} from "./label-projection";
import {
  FIELDS_QUERY,
  type ProjectIssueItem,
  REPO_FIELDS_QUERY,
  type RawProjectResponse,
  type RawRepoResponse,
  parseProjectItems,
  parseRepoIssues,
} from "./project-fields";

// ── CLI argument parsing ───────────────────────────────────────────────────────

function parseArgs(argv: string[]): {
  org: string;
  projectNumber: number;
  repo: string | undefined;
  allRepos: boolean;
  includeClosed: boolean;
  apply: boolean;
} {
  const args = argv.slice(2);
  const get = (flag: string): string | undefined => {
    const i = args.indexOf(flag);
    return i !== -1 ? args[i + 1] : undefined;
  };

  return {
    org: get("--org") ?? "konveyor",
    projectNumber: parseInt(get("--project-number") ?? "67", 10),
    repo: args.includes("--all-repos")
      ? undefined
      : (get("--repo") ?? "tackle2-ui"),
    allRepos: args.includes("--all-repos"),
    includeClosed: args.includes("--include-closed"),
    apply: args.includes("--apply"),
  };
}

// ── GraphQL client (native fetch) ─────────────────────────────────────────────

async function graphql<T>(
  token: string,
  query: string,
  variables: Record<string, unknown>
): Promise<T> {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "konveyor-label-sync-check/1.0",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as {
    data?: T;
    errors?: Array<{ message: string }>;
  };

  if (json.errors?.length) {
    throw new Error(
      `GraphQL errors:\n${json.errors.map((e) => `  • ${e.message}`).join("\n")}`
    );
  }

  if (!json.data) throw new Error("GraphQL response contained no data");
  return json.data;
}

// ── REST helpers (label apply) ────────────────────────────────────────────────

const GITHUB_REST = "https://api.github.com";
const REST_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/vnd.github+json",
  "User-Agent": "konveyor-label-sync-check/1.0",
};

async function restAddLabels(
  token: string,
  owner: string,
  repo: string,
  issueNumber: number,
  labels: string[]
): Promise<void> {
  const res = await fetch(
    `${GITHUB_REST}/repos/${owner}/${repo}/issues/${issueNumber}/labels`,
    {
      method: "POST",
      headers: { ...REST_HEADERS, Authorization: `Bearer ${token}` },
      body: JSON.stringify({ labels }),
    }
  );
  if (!res.ok)
    throw new Error(
      `add labels on #${issueNumber}: ${res.status} ${res.statusText}`
    );
}

async function restRemoveLabel(
  token: string,
  owner: string,
  repo: string,
  issueNumber: number,
  label: string
): Promise<void> {
  const res = await fetch(
    `${GITHUB_REST}/repos/${owner}/${repo}/issues/${issueNumber}/labels/${encodeURIComponent(label)}`,
    {
      method: "DELETE",
      headers: { ...REST_HEADERS, Authorization: `Bearer ${token}` },
    }
  );
  // 404 means the label wasn't present — treat as success
  if (!res.ok && res.status !== 404)
    throw new Error(
      `remove "${label}" from #${issueNumber}: ${res.status} ${res.statusText}`
    );
}

export interface ApplyResult {
  success: boolean;
  /** Error message if success is false. */
  error?: string;
}

/**
 * Apply the computed label diffs to GitHub issues via the REST API.
 * Issues with no diff are skipped.  Errors per issue are captured and
 * returned rather than thrown so the caller can report partial failures.
 *
 * @returns A map of issueNumber → ApplyResult for every issue that had changes.
 */
async function applyLabelDiffs(
  token: string,
  entries: ReportEntry[]
): Promise<Map<number, ApplyResult>> {
  const results = new Map<number, ApplyResult>();

  for (const { item, result } of entries) {
    if (isNoop(result.diff)) continue;

    process.stderr.write(
      `  Applying #${item.issueNumber} (+[${result.diff.toAdd.join(", ")}]` +
        ` -[${result.diff.toRemove.join(", ")}])...\n`
    );

    try {
      if (result.diff.toAdd.length > 0) {
        await restAddLabels(
          token,
          item.owner,
          item.repo,
          item.issueNumber,
          result.diff.toAdd
        );
      }
      for (const label of result.diff.toRemove) {
        await restRemoveLabel(
          token,
          item.owner,
          item.repo,
          item.issueNumber,
          label
        );
      }
      results.set(item.issueNumber, { success: true });
    } catch (e) {
      results.set(item.issueNumber, {
        success: false,
        error: (e as Error).message,
      });
    }
  }

  return results;
}

/**
 * Repo-scoped strategy: queries issues from a specific repository and finds
 * their field values in the target project.  The repo filter is in the GraphQL
 * variables; only issues belonging to that project are returned.
 */
async function fetchAllRepoIssues(
  token: string,
  org: string,
  repo: string,
  projectNumber: number
): Promise<{ projectTitle: string; items: ProjectIssueItem[] }> {
  const allItems: ProjectIssueItem[] = [];
  let cursor: string | null = null;
  let projectTitle = "";

  do {
    const data: RawRepoResponse = await graphql<RawRepoResponse>(
      token,
      REPO_FIELDS_QUERY,
      {
        org,
        repo,
        cursor,
      }
    );

    const { nodes, pageInfo } = data.organization.repository.issues;
    const { items: page, projectTitle: title } = parseRepoIssues(
      nodes,
      projectNumber,
      org,
      repo
    );

    if (title && !projectTitle) projectTitle = title;
    allItems.push(...page);
    cursor = pageInfo.hasNextPage ? pageInfo.endCursor : null;

    process.stderr.write(
      `  Fetched page (${nodes.length} issues, ${allItems.length} in project so far)...\n`
    );
  } while (cursor !== null);

  return { projectTitle, items: allItems };
}

/**
 * Project-scoped strategy: queries all items in the project.
 * Used for --all-repos when no specific repository is targeted.
 */
async function fetchAllProjectItems(
  token: string,
  org: string,
  projectNumber: number
): Promise<{ projectTitle: string; items: ProjectIssueItem[] }> {
  const allItems: ProjectIssueItem[] = [];
  let cursor: string | null = null;
  let projectTitle = "";

  do {
    const data: RawProjectResponse = await graphql<RawProjectResponse>(
      token,
      FIELDS_QUERY,
      {
        org,
        number: projectNumber,
        cursor,
      }
    );

    const project: RawProjectResponse["organization"]["projectV2"] =
      data.organization.projectV2;
    projectTitle = project.title;
    const { nodes, pageInfo }: typeof project.items = project.items;

    allItems.push(...parseProjectItems(nodes));
    cursor = pageInfo.hasNextPage ? pageInfo.endCursor : null;

    process.stderr.write(
      `  Fetched page (${nodes.length} items, ${allItems.length} total so far)...\n`
    );
  } while (cursor !== null);

  return { projectTitle, items: allItems };
}

// ── Report formatting ─────────────────────────────────────────────────────────

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";

function fmt(color: string, text: string): string {
  return `${color}${text}${RESET}`;
}

interface ReportEntry {
  item: ProjectIssueItem;
  result: LabelDiffResult;
}

function printReport(
  projectTitle: string,
  org: string,
  projectNumber: number,
  entries: ReportEntry[],
  opts: { includeClosed: boolean; apply: boolean },
  applyResults?: Map<number, ApplyResult>
): void {
  const needsUpdate = entries.filter((e) => !isNoop(e.result.diff));
  const upToDate = entries.filter(
    (e) => isNoop(e.result.diff) && e.result.warnings.length === 0
  );
  const warningsOnly = entries.filter(
    (e) => isNoop(e.result.diff) && e.result.warnings.length > 0
  );
  const failed = applyResults
    ? [...applyResults.values()].filter((r) => !r.success)
    : [];

  console.log();
  console.log(
    fmt(
      BOLD,
      opts.apply ? `Label Sync Apply Report` : `Label Sync Check Report`
    )
  );
  console.log(
    fmt(DIM, `Project: ${projectTitle} (${org}/projects/${projectNumber})`)
  );
  console.log(fmt(DIM, `Issues checked: ${entries.length}`));
  if (opts.apply) {
    console.log(
      fmt(DIM, `Mode: apply — label changes have been written to GitHub`)
    );
  } else {
    console.log(fmt(DIM, `Mode: dry-run — pass --apply to write changes`));
  }
  console.log();

  // ── Issues with label changes ──────────────────────────────────────────
  if (needsUpdate.length === 0) {
    console.log(
      fmt(GREEN, `✔  All ${entries.length} issues have up-to-date labels.`)
    );
  } else {
    const actionVerb = opts.apply ? "updated" : "need label updates";
    const headerColor = opts.apply && failed.length === 0 ? GREEN : RED;
    console.log(
      fmt(
        BOLD + headerColor,
        `${opts.apply ? "✔" : "✖"}  ${needsUpdate.length} issue(s) ${actionVerb}:`
      )
    );
    console.log();

    for (const { item, result } of needsUpdate) {
      const applyResult = applyResults?.get(item.issueNumber);
      const applyTag = applyResult
        ? applyResult.success
          ? fmt(GREEN, " [applied]")
          : fmt(RED, ` [FAILED: ${applyResult.error}]`)
        : "";
      const stateTag =
        item.issueState === "CLOSED" ? fmt(DIM, " [closed]") : "";
      console.log(
        `  ${fmt(BOLD, `#${item.issueNumber}`)}${stateTag}${applyTag}  ${item.issueTitle}`
      );
      console.log(`  ${fmt(DIM, item.issueUrl)}`);

      const fieldSummary = [
        item.fields.status ? `Status="${item.fields.status}"` : "Status=?",
        item.fields.priority
          ? `Priority="${item.fields.priority}"`
          : "Priority=?",
      ].join("  ");
      console.log(`  ${fmt(DIM, `Fields: ${fieldSummary}`)}`);
      console.log(
        `  ${fmt(DIM, `Current managed labels: ${summarizeManagedLabels(item.currentLabels)}`)}`
      );

      for (const label of result.diff.toAdd) {
        console.log(`    ${fmt(GREEN, `+ ${label}`)}`);
      }
      for (const label of result.diff.toRemove) {
        console.log(`    ${fmt(RED, `- ${label}`)}`);
      }

      for (const w of result.warnings) {
        console.log(`    ${fmt(YELLOW, `⚠  ${w.message}`)}`);
      }

      console.log();
    }
  }

  // ── Warnings only (no label changes but unmapped values) ──────────────
  if (warningsOnly.length > 0) {
    console.log(
      fmt(
        YELLOW,
        `⚠  ${warningsOnly.length} issue(s) have unmapped field values (labels unchanged):`
      )
    );
    for (const { item, result } of warningsOnly) {
      console.log(`  ${fmt(BOLD, `#${item.issueNumber}`)}  ${item.issueTitle}`);
      for (const w of result.warnings) {
        console.log(`    ${fmt(YELLOW, `⚠  ${w.message}`)}`);
      }
    }
    console.log();
  }

  // ── Up to date ────────────────────────────────────────────────────────
  if (upToDate.length > 0) {
    console.log(
      fmt(DIM, `✔  ${upToDate.length} issue(s) already have correct labels.`)
    );
  }

  // ── Unrecognized field names summary ──────────────────────────────────
  const allUnknownFields = new Set<string>();
  for (const { item } of entries) {
    for (const f of item.unknownFieldNames) allUnknownFields.add(f);
  }
  if (allUnknownFields.size > 0) {
    console.log();
    console.log(
      fmt(
        CYAN,
        `ℹ  Unrecognized project field names (not mapped in mappings.ts): ` +
          `${[...allUnknownFields].join(", ")}`
      )
    );
    console.log(
      fmt(
        DIM,
        `  If any of these are "Status" or "Priority", update FIELD_NAMES in mappings.ts.`
      )
    );
  }

  console.log();

  // Exit codes:
  //   dry-run: exit 1 if any issues need updates (useful in CI)
  //   apply:   exit 1 if any applies failed
  if (opts.apply) {
    if (failed.length > 0) process.exitCode = 1;
  } else {
    if (needsUpdate.length > 0) process.exitCode = 1;
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error(
      "Error: GITHUB_TOKEN environment variable is required.\n" +
        "Create a token with read:project and read:org scopes at https://github.com/settings/tokens\n" +
        "\nUsage:\n" +
        "  GITHUB_TOKEN=<token> npm run sync-labels:check [-- --org konveyor --project-number 67 --repo tackle2-ui [--apply]]"
    );
    process.exit(1);
  }

  const opts = parseArgs(process.argv);

  process.stderr.write(
    `Fetching project ${opts.org}/projects/${opts.projectNumber}` +
      (opts.repo ? ` (filtering to repo: ${opts.repo})` : " (all repos)") +
      "...\n"
  );

  const { projectTitle, items } = opts.repo
    ? await fetchAllRepoIssues(token, opts.org, opts.repo, opts.projectNumber)
    : await fetchAllProjectItems(token, opts.org, opts.projectNumber);

  // Filter out closed issues unless --include-closed is set, then sort by issue number
  const filtered = (
    opts.includeClosed ? items : items.filter((i) => i.issueState === "OPEN")
  ).sort((a, b) => a.issueNumber - b.issueNumber);

  if (filtered.length === 0) {
    console.log(
      `No ${opts.includeClosed ? "" : "open "}issues found in project` +
        (opts.repo ? ` for repo "${opts.repo}"` : "") +
        "."
    );
    return;
  }

  process.stderr.write(`Processing ${filtered.length} issues...\n`);

  const entries: ReportEntry[] = filtered.map((item) => ({
    item,
    result: computeLabelDiff(item.fields, item.currentLabels),
  }));

  let applyResults: Map<number, ApplyResult> | undefined;
  if (opts.apply) {
    const toApply = entries.filter((e) => !isNoop(e.result.diff));
    if (toApply.length === 0) {
      process.stderr.write(`No label changes to apply.\n`);
    } else {
      process.stderr.write(
        `Applying label diffs to ${toApply.length} issue(s)...\n`
      );
      applyResults = await applyLabelDiffs(token, toApply);
    }
  }

  printReport(
    projectTitle,
    opts.org,
    opts.projectNumber,
    entries,
    opts,
    applyResults
  );
}

main().catch((err) => {
  console.error(`\nFatal error: ${(err as Error).message}`);
  process.exit(1);
});
