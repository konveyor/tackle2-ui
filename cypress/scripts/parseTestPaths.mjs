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

/**
 * Extract test paths from PR description
 */
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

  // Extract lines until next markdown header (# or ##) or end of text
  const lines = afterMarker.split("\n");
  const paths = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Stop at markdown headers
    if (trimmed.startsWith("#")) {
      break;
    }

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith("<!--")) {
      continue;
    }

    // Skip markdown list markers, checkboxes, etc.
    const cleanPath = trimmed.replace(/^[-*]\s*(\[[ x]\]\s*)?/, "").trim();

    if (cleanPath) {
      paths.push(cleanPath);
    }
  }

  return paths;
}

/**
 * Resolve a path pattern to actual test files
 */
function resolvePathToFiles(pathPattern) {
  // Clean up the path
  const cleanPath = pathPattern.replace(/^\/+|\/+$/g, "");

  // Build glob pattern relative to TEST_ROOT
  let globPattern;

  if (cleanPath.includes("*")) {
    // Already has glob pattern
    globPattern = resolve(TEST_ROOT, cleanPath);
  } else if (cleanPath.endsWith(".test.ts") || cleanPath.endsWith(".test.js")) {
    // Specific file
    globPattern = resolve(TEST_ROOT, cleanPath);
  } else {
    // Directory - match all test files in it (non-recursive by default)
    // User should use **/*.test.ts for recursive
    globPattern = resolve(TEST_ROOT, cleanPath, "*.test.{ts,js}");
  }

  try {
    const files = globSync(globPattern);
    return files;
  } catch (error) {
    console.error(
      `Warning: Failed to resolve pattern "${pathPattern}": ${error.message}`,
      { file: process.stderr }
    );
    return [];
  }
}

/**
 * Main function
 */
function main() {
  // Extract paths from PR description
  const testPaths = extractTestPaths(prBody);

  if (testPaths.length === 0) {
    // No test-paths marker found - signal fallback to tag-based selection
    console.log("");
    process.exit(0);
  }

  // Resolve all paths to actual files
  const allFiles = new Set();

  for (const pathPattern of testPaths) {
    const files = resolvePathToFiles(pathPattern);

    if (files.length === 0) {
      console.error(`Warning: No files matched pattern "${pathPattern}"`, {
        file: process.stderr,
      });
    }

    files.forEach((f) => allFiles.add(f));
  }

  if (allFiles.size === 0) {
    console.error(
      "Warning: No test files found for any specified paths - falling back to tag-based selection",
      { file: process.stderr }
    );
    console.log("");
    process.exit(0);
  }

  // Output comma-separated list of files
  console.log([...allFiles].join(","));
}

main();
