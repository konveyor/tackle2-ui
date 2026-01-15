#!/usr/bin/env node
/* global process */

import { resolve } from "node:path";

import { globSync } from "glob";

/**
 * Parses PR description for test paths after 'test-paths:' marker
 * and resolves them to actual test file paths.
 *
 * @param {string} prBody - The PR description body
 * @returns {string} Comma-separated list of resolved test file paths
 *                   Empty string if no test-paths marker found (signals fallback to tags)
 */

// Example PR description format:
// test-paths:
// administration/credentials/*.test.ts
// migration/controls/**/*.test.ts
// administration/credentials/maven_crud.test.ts

// Read PR body from CLI argument
const prBody = process.argv[2] || "";

const TEST_ROOT = resolve("e2e/tests");
function extractTestPaths(prDescription) {
  if (!prDescription) {
    return [];
  }

  // Find test-paths: marker (case insensitive)
  const markerRegex = /test-paths:\s*$/im;
  const match = prDescription.match(markerRegex);

  if (!match) {
    return [];
  }

  // Get content after the marker
  const afterMarker = prDescription.slice(match.index + match[0].length);
  const lines = afterMarker.split("\n");
  const paths = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("#")) {
      break;
    }
    if (!trimmed || trimmed.startsWith("<!--")) {
      continue;
    }
    const cleanPath = trimmed.replace(/^[-*]\s*(\[[ x]\]\s*)?/, "").trim();

    if (cleanPath) {
      paths.push(cleanPath);
    }
  }

  return paths;
}

function resolvePathToFiles(pathPattern) {
  const cleanPath = pathPattern.replace(/^\/+|\/+$/g, "");
  let globPattern;

  if (cleanPath.includes("*")) {
    globPattern = resolve(TEST_ROOT, cleanPath);
  } else if (cleanPath.endsWith(".test.ts") || cleanPath.endsWith(".test.js")) {
    globPattern = resolve(TEST_ROOT, cleanPath);
  } else {
    globPattern = resolve(TEST_ROOT, cleanPath, "*.test.{ts,js}");
  }

  try {
    const files = globSync(globPattern);
    return files;
  } catch (error) {
    console.error(
      `Warning: Failed to resolve pattern "${pathPattern}": ${error.message}`
    );
    return [];
  }
}

function main() {
  const testPaths = extractTestPaths(prBody);

  if (testPaths.length === 0) {
    console.log("");
    process.exit(0);
  }

  const allFiles = new Set();

  for (const pathPattern of testPaths) {
    const files = resolvePathToFiles(pathPattern);

    if (files.length === 0) {
      console.error(`Warning: No files matched pattern "${pathPattern}"`);
    }

    files.forEach((f) => allFiles.add(f));
  }

  if (allFiles.size === 0) {
    console.error(
      "Warning: No test files found for any specified paths - falling back to tag-based selection"
    );
    console.log("");
    process.exit(0);
  }

  // Output comma-separated list of files
  console.log([...allFiles].join(","));
}

main();
