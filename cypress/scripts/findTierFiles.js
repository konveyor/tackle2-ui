#!/usr/bin/env node
/* global process */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { globSync } from "glob";

// Read tier tags from CLI argument
const tierArg = process.argv[2];
if (!tierArg) {
  console.error("Usage: node findTierFiles.js <tierTag1,tierTag2,...>");
  process.exit(1);
}

// Split multiple tiers
const tierTags = tierArg.split(",").map((t) => t.trim());

const rootDir = resolve("cypress/e2e/tests");

function getAllTestFiles(dir) {
  return globSync("**/*.{ts,js}", { cwd: dir, absolute: true });
}

function fileContainsAnyTier(file, tags) {
  const content = readFileSync(file, "utf-8");
  return tags.some((tag) => new RegExp(`@${tag}\\b`, "i").test(content));
}

const allFiles = getAllTestFiles(rootDir);
const tierFiles = allFiles.filter((file) =>
  fileContainsAnyTier(file, tierTags)
);

console.log(tierFiles.join(","));
