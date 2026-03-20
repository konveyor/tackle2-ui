#!/usr/bin/env node
/* global process */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { globSync } from "glob";

// Read tier tags from CLI argument
const tierArg = process.argv[2];
if (!tierArg) {
  console.error("Usage: node findTierFiles.mjs <tierTag1,tierTag2,...>");
  process.exit(1);
}

// Split multiple tiers
const tierTags = tierArg.split(",").map((t) => t.trim().replace(/^@/, ""));

const rootDir = resolve("e2e/tests");

// GitHub configuration
const GITHUB_OWNER = "konveyor";
const GITHUB_REPO = "tackle2-ui";
const GITHUB_API_URL = "https://api.github.com";
const GIT_USER = process.env.GIT_USER || "";
const GIT_PASSWORD = process.env.GIT_PASSWORD || "";
// Skip bug tests by default if credentials are available
const SKIP_BUG_TESTS = GIT_USER && GIT_PASSWORD;

// Bug pattern matching MTA-XXXX, TACKLE-XXXX, Tackle-XXXX
const bugPattern = /Bug\s+((?:MTA|Tackle|TACKLE)-\d+)/gi;

function getAllTestFiles(dir) {
  return globSync("**/*.{ts,js}", { cwd: dir, absolute: true });
}

function fileContainsAnyTier(file, tags) {
  const content = readFileSync(file, "utf-8");
  return tags.some((tag) => new RegExp(`@${tag}\\b`, "i").test(content));
}

/**
 * Extract bug IDs from a test file
 */
function extractBugIds(filePath) {
  const content = readFileSync(filePath, "utf-8");
  const matches = [...content.matchAll(bugPattern)];
  return [...new Set(matches.map((m) => m[1]))]; // Unique bug IDs
}

/**
 * Check if a GitHub issue is open
 */
async function isGitHubIssueOpen(issueNumber) {
  if (!GIT_USER || !GIT_PASSWORD) {
    console.error(
      "Warning: GIT_USER or GIT_PASSWORD not set. Cannot check GitHub issue status."
    );
    return false;
  }

  const url = `${GITHUB_API_URL}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues/${issueNumber}`;
  const credentials = btoa(`${GIT_USER}:${GIT_PASSWORD}`);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Basic ${credentials}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "Cypress-GitHub-Utils",
      },
    });

    if (!response.ok) {
      console.error(
        `Failed to fetch GitHub issue #${issueNumber}: ${response.status} ${response.statusText}`
      );
      return false;
    }

    const issue = await response.json();
    return issue.state === "open";
  } catch (error) {
    console.error(
      `Error checking GitHub issue #${issueNumber}:`,
      error.message
    );
    return false;
  }
}

/**
 * Check if a file should be skipped based on open bug issues
 */
async function shouldSkipFileWithBugs(filePath) {
  if (!SKIP_BUG_TESTS) {
    return false;
  }

  const bugIds = extractBugIds(filePath);
  if (bugIds.length === 0) {
    return false;
  }

  // Extract issue numbers from bug IDs (e.g., "MTA-2782" -> "2782")
  const issueNumbers = bugIds.map((id) => id.split("-")[1]);

  // Check if any of the issues are open
  for (const issueNum of issueNumbers) {
    const isOpen = await isGitHubIssueOpen(issueNum);
    if (isOpen) {
      console.error(
        `Skipping ${filePath.split("/").pop()} - contains open bug: ${bugIds.find((id) => id.includes(issueNum))}`
      );
      return true;
    }
  }

  return false;
}

// Main execution
async function main() {
  const allFiles = getAllTestFiles(rootDir);
  const tierFiles = allFiles.filter((file) =>
    fileContainsAnyTier(file, tierTags)
  );

  if (!SKIP_BUG_TESTS) {
    console.error("Bug-skipping disabled (no GitHub credentials)");
    console.log(tierFiles.join(","));
    return;
  }

  console.error("Bug-skipping enabled - checking GitHub issue status...");

  // Filter out files with open bugs
  const filteredFiles = [];
  for (const file of tierFiles) {
    const shouldSkip = await shouldSkipFileWithBugs(file);
    if (!shouldSkip) {
      filteredFiles.push(file);
    }
  }

  const skippedCount = tierFiles.length - filteredFiles.length;
  if (skippedCount > 0) {
    console.error(`Skipped ${skippedCount} test file(s) with open bugs`);
  }

  console.log(filteredFiles.join(","));
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
