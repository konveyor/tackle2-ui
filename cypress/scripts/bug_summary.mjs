#!/usr/bin/env node
/* global process */
import { readFile, writeFile } from "fs/promises";

import { table } from "table";

const bugPattern = /Bug\s+((?:MTA|Tackle|TACKLE)-\d+)/i;
const fileArg = process.argv[2] || "run/report/index.json";
const outputFile = "run/report/bug-summary.json";

const red = (text) => `\x1b[31m${text}\x1b[0m`;
const green = (text) => `\x1b[32m${text}\x1b[0m`;
const yellow = (text) => `\x1b[33m${text}\x1b[0m`;
const SPEC_COL_WIDTH = 35;

// GitHub configuration
const GITHUB_OWNER = "konveyor";
const GITHUB_REPO = "tackle2-ui";
const GITHUB_API_URL = "https://api.github.com";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";

/**
 * Check if a GitHub issue is open
 */
async function isGitHubIssueOpen(issueNumber) {
  if (!GITHUB_TOKEN) {
    return false; // Without token, can't verify - treat as unknown
  }

  const url = `${GITHUB_API_URL}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues/${issueNumber}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "Cypress-Bug-Summary",
      },
    });

    if (!response.ok) {
      console.error(
        `Failed to fetch GitHub issue #${issueNumber}: ${response.status}`
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

let json;
try {
  const fileContent = await readFile(fileArg, "utf-8");
  json = JSON.parse(fileContent);
} catch {
  json = { results: [] };
}

const specs = {};
const failedTests = []; // Track all failed tests for bug classification

const processSuite = (suite, specName) => {
  (suite.tests || []).forEach((t) => {
    const s = specs[specName];
    s.total++;

    const bugMatch = t.title.match(bugPattern);
    if (bugMatch) s.bugs.push(bugMatch[1]);

    switch (t.state) {
      case "passed":
        s.passing++;
        break;
      case "failed":
        s.failing++;
        // Track failed test with its bug info for later classification
        failedTests.push({
          spec: specName,
          title: t.title,
          bugId: bugMatch ? bugMatch[1] : null,
          issueNumber: bugMatch ? bugMatch[1].split("-")[1] : null,
        });
        break;
      case "pending":
        s.pending++;
        break;
      case "skipped":
        s.skipped++;
        break;
    }
  });

  (suite.suites || []).forEach((nested) => processSuite(nested, specName));
};

json.results.forEach((result) => {
  let specName = result.file ?? "unknown";
  specName = specName.replace(/^e2e\/tests\//, "");
  specs[specName] ||= {
    total: 0,
    passing: 0,
    failing: 0,
    pending: 0,
    skipped: 0,
    bugs: [],
    knownFailures: 0,
    unknownFailures: 0,
  };

  (result.suites || []).forEach((suite) => processSuite(suite, specName));
});

// Classify failed tests as known (with open bugs) or unknown failures
console.log("\n🔍 Classifying failures...");
const knownFailures = [];
const unknownFailures = [];

for (const test of failedTests) {
  if (test.issueNumber && GITHUB_TOKEN) {
    const isOpen = await isGitHubIssueOpen(test.issueNumber);
    if (isOpen) {
      knownFailures.push(test);
      specs[test.spec].knownFailures++;
      console.log(
        `  ✓ Known failure: ${test.spec} - ${test.title} (${test.bugId} is open)`
      );
    } else {
      unknownFailures.push(test);
      specs[test.spec].unknownFailures++;
      console.log(
        `  ✗ Unknown failure: ${test.spec} - ${test.title} (${test.bugId} is closed)`
      );
    }
  } else {
    unknownFailures.push(test);
    specs[test.spec].unknownFailures++;
    const reason = test.bugId ? "no GITHUB_TOKEN" : "no bug marker";
    console.log(
      `  ✗ Unknown failure: ${test.spec} - ${test.title} (${reason})`
    );
  }
}

const rows = [
  ["Spec", "Tests", "Passing", "Failing", "Pending", "Skipped", "Bug IDs"],
];

Object.keys(specs)
  .sort()
  .forEach((spec) => {
    const s = specs[spec];
    const bugList = s.bugs.length ? s.bugs : ["-"];

    rows.push([
      spec,
      s.total,
      green(s.passing),
      s.failing > 0 ? red(s.failing) : s.failing,
      s.pending,
      s.skipped,
      bugList.join("\n"),
    ]);
  });

const totals = Object.values(specs).reduce(
  (acc, s) => {
    acc.total += s.total;
    acc.passing += s.passing;
    acc.failing += s.failing;
    acc.knownFailures += s.knownFailures;
    acc.unknownFailures += s.unknownFailures;
    acc.pending += s.pending;
    acc.skipped += s.skipped;
    acc.bugs += s.bugs.length;
    return acc;
  },
  {
    total: 0,
    passing: 0,
    failing: 0,
    knownFailures: 0,
    unknownFailures: 0,
    pending: 0,
    skipped: 0,
    bugs: 0,
  }
);

const percentFailed = totals.total
  ? Math.round((totals.failing / totals.total) * 100)
  : 0;

const percentUnknown = totals.total
  ? Math.round((totals.unknownFailures / totals.total) * 100)
  : 0;

let summaryText;
if (totals.unknownFailures > 0) {
  summaryText = red(
    `✖ ${totals.unknownFailures} unknown failures of ${totals.total} (${percentUnknown}%)`
  );
} else if (totals.knownFailures > 0) {
  summaryText = yellow(
    `⚠ ${totals.knownFailures} known failures (open bugs), 0 unknown`
  );
} else {
  summaryText = green(`✓ ${totals.total} tests passed`);
}

rows.push([
  summaryText,
  totals.total,
  green(totals.passing),
  totals.failing > 0 ? red(totals.failing) : totals.failing,
  totals.pending,
  totals.skipped,
  "-",
]);

console.log(
  table(rows, {
    columns: {
      0: { wrapWord: true, width: SPEC_COL_WIDTH },
      6: { wrapWord: true, width: 22 },
    },
    drawHorizontalLine: () => true,
  })
);

if (GITHUB_TOKEN) {
  console.log("\n📊 Failure Classification:");
  console.log(
    `  ${yellow("●")} Known failures: ${totals.knownFailures} (tests with open bugs)`
  );
  console.log(
    `  ${red("●")} Unknown failures: ${totals.unknownFailures} (tests without bugs or with closed bugs)`
  );
} else {
  console.log("\n⚠️  GITHUB_TOKEN not set - all failures treated as unknown");
}

// Prepare JSON output with bug summary
const specsArray = Object.keys(specs)
  .sort()
  .map((specName) => ({
    spec: specName,
    tests: specs[specName].total,
    passing: specs[specName].passing,
    failing: specs[specName].failing,
    knownFailures: specs[specName].knownFailures,
    unknownFailures: specs[specName].unknownFailures,
    pending: specs[specName].pending,
    skipped: specs[specName].skipped,
    bugCount: specs[specName].bugs.length,
    bugIds: specs[specName].bugs,
  }));

const summaryOutput = {
  summary: {
    totalTests: totals.total,
    passing: totals.passing,
    failing: totals.failing,
    knownFailures: totals.knownFailures,
    unknownFailures: totals.unknownFailures,
    pending: totals.pending,
    skipped: totals.skipped,
    totalBugs: totals.bugs,
    percentFailed: percentFailed,
    percentUnknown: percentUnknown,
  },
  knownFailuresList: knownFailures,
  unknownFailuresList: unknownFailures,
  specs: specsArray,
  generatedAt: new Date().toISOString(),
};

// Save to JSON file
try {
  await writeFile(outputFile, JSON.stringify(summaryOutput, null, 2), "utf-8");
  console.log(`\nBug summary saved to: ${outputFile}`);
} catch (error) {
  console.error(`\nFailed to save bug summary: ${error.message}`);
}

// Exit with success if only known failures (open bugs), fail only on unknown failures
if (totals.unknownFailures > 0) {
  console.log(
    `\n${red("✖")} CI FAILED: ${totals.unknownFailures} unknown failure(s) detected`
  );
  process.exit(1);
} else if (totals.knownFailures > 0) {
  console.log(
    `\n${green("✓")} CI PASSED: ${totals.knownFailures} known failure(s) (open bugs) - treated as expected failures`
  );
  process.exit(0);
} else {
  console.log(`\n${green("✓")} CI PASSED: All tests passed`);
  process.exit(0);
}
