#!/usr/bin/env node
/* global process */
import { readFile, writeFile } from "fs/promises";

import { table } from "table";

const bugPattern = /Bug\s+([A-Z]+-\d+)/i;
const fileArg = process.argv[2] || "run/report/index.json";
const outputFile = "run/report/bug-summary.json";

const red = (text) => `\x1b[31m${text}\x1b[0m`;
const green = (text) => `\x1b[32m${text}\x1b[0m`;
const SPEC_COL_WIDTH = 35;

let json;
try {
  const fileContent = await readFile(fileArg, "utf-8");
  json = JSON.parse(fileContent);
} catch {
  json = { results: [] };
}

const specs = {};

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
  };

  (result.suites || []).forEach((suite) => processSuite(suite, specName));
});

const rows = [
  [
    "Spec",
    "Tests",
    "Passing",
    "Failing",
    "Pending",
    "Skipped",
    "Bug Count",
    "Bug IDs",
  ],
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
      s.bugs.length > 0 ? red(s.bugs.length) : s.bugs.length,
      bugList.join("\n"),
    ]);
  });

const totals = Object.values(specs).reduce(
  (acc, s) => {
    acc.total += s.total;
    acc.passing += s.passing;
    acc.failing += s.failing;
    acc.pending += s.pending;
    acc.skipped += s.skipped;
    acc.bugs += s.bugs.length;
    return acc;
  },
  { total: 0, passing: 0, failing: 0, pending: 0, skipped: 0, bugs: 0 }
);

const percentFailed = totals.total
  ? Math.round((totals.failing / totals.total) * 100)
  : 0;

rows.push([
  totals.failing > 0
    ? red(`✖ ${totals.failing} of ${totals.total} failed (${percentFailed}%)`)
    : green(`✓ ${totals.total} tests passed`),
  totals.total,
  green(totals.passing),
  totals.failing > 0 ? red(totals.failing) : totals.failing,
  totals.pending,
  totals.skipped,
  totals.bugs > 0 ? red(totals.bugs) : totals.bugs,
  "-",
]);

console.log(
  table(rows, {
    columns: {
      0: { wrapWord: true, width: SPEC_COL_WIDTH },
      7: { wrapWord: true, width: 22 },
    },
    drawHorizontalLine: () => true,
  })
);

// Prepare JSON output with bug summary
const specsArray = Object.keys(specs)
  .sort()
  .map((specName) => ({
    spec: specName,
    tests: specs[specName].total,
    passing: specs[specName].passing,
    failing: specs[specName].failing,
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
    pending: totals.pending,
    skipped: totals.skipped,
    totalBugs: totals.bugs,
    percentFailed: percentFailed,
  },
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
