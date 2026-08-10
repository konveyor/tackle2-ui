/**
 * The target-branch block of the run detail pages: the branch link, a
 * GitHub-only commit feed (the one host whose REST API is CORS-open and
 * unauthenticated — 60 req/hr/IP, so polling is frugal: 60s while the run
 * is live, exactly once when terminal), and the by-convention stage output
 * files (PLAN.md, .konveyor/analysis.json) the workflow stages chain
 * through on that branch.
 */
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Button, Content, Label } from "@patternfly/react-core";

import type { Application } from "@app/api/models";

/** Frugal against the unauthenticated GitHub API rate limit (60/hr/IP). */
const FEED_POLL_MS = 60_000;

/** Files the stages write to the branch, by convention. */
const STAGE_OUTPUT_PATHS = ["PLAN.md", ".konveyor/analysis.json"];

/** Auto-commit prefix the harness uses for progress commits. */
const PROGRESS_PREFIX = "konveyor:";

const muted: CSSProperties = {
  color: "var(--pf-t--global--text--color--subtle)",
};

// ----------------------------------------------------- git host URL helpers

/**
 * {owner, repo} when the URL is a github.com repository (the one host whose
 * REST API is CORS-open to browsers, so the console can show a commit feed
 * without credentials). Everything else — GitLab, Gitea, ssh remotes —
 * returns undefined and callers degrade to plain text.
 */
export function parseGitHubRepo(
  repoUrl?: string
): { owner: string; repo: string } | undefined {
  if (!repoUrl) return undefined;
  const m =
    /^https?:\/\/(?:www\.)?github\.com\/([^/]+)\/([^/]+?)(?:\.git)?\/?$/.exec(
      repoUrl.trim()
    );
  return m?.[1] && m[2] ? { owner: m[1], repo: m[2] } : undefined;
}

/** Web URL of a branch on the repo's host; undefined when the host shape is unknown. */
export function repoBranchUrl(
  repoUrl: string | undefined,
  branch: string
): string | undefined {
  if (!repoUrl) return undefined;
  const base = repoUrl
    .trim()
    .replace(/\/+$/, "")
    .replace(/\.git$/, "");
  if (parseGitHubRepo(repoUrl)) {
    return `${base}/tree/${encodeURIComponent(branch)}`;
  }
  if (/^https?:\/\/(?:www\.)?gitlab\.com\//.test(base)) {
    return `${base}/-/tree/${encodeURIComponent(branch)}`;
  }
  return undefined;
}

/** Web URL of a file on a branch (GitHub/GitLab shapes only). */
export function repoFileUrl(
  repoUrl: string | undefined,
  branch: string,
  path: string
): string | undefined {
  if (!repoUrl) return undefined;
  const base = repoUrl
    .trim()
    .replace(/\/+$/, "")
    .replace(/\.git$/, "");
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  if (parseGitHubRepo(repoUrl)) {
    return `${base}/blob/${encodeURIComponent(branch)}/${encodedPath}`;
  }
  if (/^https?:\/\/(?:www\.)?gitlab\.com\//.test(base)) {
    return `${base}/-/blob/${encodeURIComponent(branch)}/${encodedPath}`;
  }
  return undefined;
}

function truncate(text: string, max: number): string {
  const t = text.trim();
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

/** kubectl-style age for commit dates: 42s, 12m, 3h, 5d. */
function formatCommitAge(date?: string): string {
  if (!date) return "";
  const ms = Date.now() - new Date(date).getTime();
  if (!Number.isFinite(ms) || ms < 0) return "";
  const s = Math.floor(ms / 1000);
  if (s < 120) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 120) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

// ------------------------------------------------------------- commit feed

interface CommitRow {
  sha: string;
  htmlUrl: string;
  /** First line of the commit message, truncated for display. */
  message: string;
  date?: string;
}

interface GitHubCommitJson {
  sha?: string;
  html_url?: string;
  commit?: {
    message?: string;
    author?: { date?: string } | null;
    committer?: { date?: string } | null;
  };
}

type FeedState =
  | "loading"
  | "ok"
  /** 404 — the harness has not pushed the branch yet. */
  | "not-pushed"
  /** 403/429 — stop polling permanently; retrying only digs the hole deeper. */
  | "rate-limited"
  /** Network hiccup — transient, keep polling. */
  | "network-error";

export function BranchPanel({
  application,
  repoUrl: repoUrlOverride,
  targetBranch,
  isTerminal,
}: {
  application?: Application;
  /**
   * Repo the run actually used (its `repository` param), which wins over the
   * application record — the app's URL can be repointed after the run.
   */
  repoUrl?: string;
  targetBranch: string;
  isTerminal: boolean;
}) {
  const { t } = useTranslation();
  const repoUrl = repoUrlOverride ?? application?.repository?.url;
  const gh = parseGitHubRepo(repoUrl);
  const owner = gh?.owner;
  const repo = gh?.repo;
  const branchUrl = repoBranchUrl(repoUrl, targetBranch);

  const [commits, setCommits] = useState<CommitRow[] | null>(null);
  const [feed, setFeed] = useState<FeedState>("loading");
  /** path -> known presence; unknown (unchecked or 403-skipped) keys absent. */
  const [filePresence, setFilePresence] = useState<Record<string, boolean>>({});
  /** Manual re-fetch trigger for terminal runs (no interval to retry for them). */
  const [retryNonce, setRetryNonce] = useState(0);

  useEffect(() => {
    if (!owner || !repo) return;
    let disposed = false;
    let inFlight = false;
    let stopped = false;
    let lastHead: string | undefined;
    let timer: ReturnType<typeof setInterval> | undefined;

    // Existence checks only run when the feed's head sha changes — one
    // request per file per new commit, never per poll.
    const checkFiles = async () => {
      for (const path of STAGE_OUTPUT_PATHS) {
        const encoded = path.split("/").map(encodeURIComponent).join("/");
        try {
          const res = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/contents/${encoded}?ref=${encodeURIComponent(targetBranch)}`
          );
          if (disposed) return;
          if (res.status === 200) {
            setFilePresence((prev) => ({ ...prev, [path]: true }));
          } else if (res.status === 404) {
            setFilePresence((prev) => ({ ...prev, [path]: false }));
          }
          // 403 (rate limit): skip silently — stale presence beats noise.
        } catch {
          // Network hiccup on an existence check: skip silently.
        }
      }
    };

    const tick = async () => {
      if (inFlight || stopped) return;
      inFlight = true;
      try {
        const res = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/commits?sha=${encodeURIComponent(targetBranch)}&per_page=15`
        );
        if (disposed) return;
        if (res.status === 404) {
          setFeed("not-pushed");
          return;
        }
        if (res.status === 403 || res.status === 429) {
          setFeed("rate-limited");
          stopped = true;
          if (timer) clearInterval(timer);
          return;
        }
        if (!res.ok) {
          setFeed("network-error");
          return;
        }
        const data = (await res.json()) as GitHubCommitJson[];
        if (disposed) return;
        const rows: CommitRow[] = data
          .filter(
            (c): c is GitHubCommitJson & { sha: string } =>
              typeof c.sha === "string"
          )
          .map((c) => ({
            sha: c.sha,
            htmlUrl: c.html_url ?? "",
            message: truncate(
              (c.commit?.message ?? "").split("\n")[0] ?? "",
              80
            ),
            date:
              c.commit?.author?.date ?? c.commit?.committer?.date ?? undefined,
          }));
        setCommits(rows);
        setFeed("ok");
        const head = rows[0]?.sha;
        if (head && head !== lastHead) {
          lastHead = head;
          void checkFiles();
        }
      } catch {
        if (!disposed) setFeed("network-error"); // transient — keep polling
      } finally {
        inFlight = false;
      }
    };

    void tick();
    if (!isTerminal) {
      timer = setInterval(() => void tick(), FEED_POLL_MS);
    }
    return () => {
      disposed = true;
      if (timer) clearInterval(timer);
    };
  }, [owner, repo, targetBranch, isTerminal, retryNonce]);

  const branchCode = <code>{targetBranch}</code>;

  const stageOutputs = (withPresence: boolean) => {
    const links = STAGE_OUTPUT_PATHS.map((path) => {
      const url = repoFileUrl(repoUrl, targetBranch, path);
      if (!url) return null;
      return (
        <span key={path} style={{ marginRight: "1rem" }}>
          <a href={url} target="_blank" rel="noreferrer">
            <code>{path}</code>
          </a>
          {withPresence && filePresence[path] === true && (
            <span> {t("agentic.runDetail.filePresent")}</span>
          )}
          {withPresence && filePresence[path] === false && (
            <span style={muted}>
              {" "}
              {t("agentic.runDetail.fileNotPresentYet")}
            </span>
          )}
        </span>
      );
    }).filter(Boolean);
    if (links.length === 0) return null;
    return (
      <div style={{ marginTop: "0.75rem" }}>
        <span style={muted}>{t("agentic.runDetail.stageOutputs")} </span>
        {links}
      </div>
    );
  };

  return (
    <div style={{ marginTop: "1rem" }}>
      <Content>
        <Content component="h3">{t("terms.targetBranch")}</Content>
      </Content>
      <div style={{ marginTop: "0.5rem" }}>
        {branchUrl ? (
          <a href={branchUrl} target="_blank" rel="noreferrer">
            {branchCode}
          </a>
        ) : (
          branchCode
        )}
      </div>

      {repoUrl && !gh && (
        <div style={{ ...muted, marginTop: "0.5rem" }}>
          {t("agentic.runDetail.feedGitHubOnly")}
        </div>
      )}

      {gh && (
        <div style={{ marginTop: "0.75rem" }}>
          {feed === "not-pushed" && (
            <div style={muted}>{t("agentic.runDetail.feedNotPushed")}</div>
          )}
          {feed === "rate-limited" && (
            <Alert
              variant="info"
              isInline
              isPlain
              title={t("agentic.runDetail.feedRateLimited")}
            />
          )}
          {feed === "network-error" &&
            // While the run is live the interval genuinely retries; terminal
            // runs fetch exactly once, so offer a manual retry instead of a
            // "retrying" claim that would never come true.
            (isTerminal ? (
              <div style={muted}>
                {t("agentic.runDetail.feedNetworkError")}{" "}
                <Button
                  variant="link"
                  isInline
                  onClick={() => setRetryNonce((n) => n + 1)}
                >
                  {t("agentic.runDetail.retry")}
                </Button>
              </div>
            ) : (
              <div style={muted}>
                {t("agentic.runDetail.feedNetworkErrorRetrying")}
              </div>
            ))}
          {feed === "ok" && commits !== null && commits.length === 0 && (
            <div style={muted}>{t("agentic.runDetail.noCommitsYet")}</div>
          )}
          {commits !== null &&
            commits.length > 0 &&
            (feed === "ok" || feed === "network-error") &&
            commits.map((c) => (
              <div
                key={c.sha}
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: "0.5rem",
                  marginBottom: "0.25rem",
                }}
              >
                <a href={c.htmlUrl} target="_blank" rel="noreferrer">
                  <code>{c.sha.slice(0, 7)}</code>
                </a>
                {c.message.startsWith(PROGRESS_PREFIX) ? (
                  <Label isCompact color="blue">
                    {c.message}
                  </Label>
                ) : (
                  <span>{c.message}</span>
                )}
                <span style={muted}>{formatCommitAge(c.date)}</span>
              </div>
            ))}
        </div>
      )}

      {gh ? stageOutputs(true) : stageOutputs(false)}
    </div>
  );
}
