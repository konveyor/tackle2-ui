#!/usr/bin/env node
/*
  Analyze how prettier would process the files in the current directory and subdirectories,
  respecting the `.gitignore` and `.prettierignore` files.

  Example:
    $ cd cypress
    $ ../hack/prettier_config_check.js
    ...
    Found 100 files (respecting .gitignore)
    ...
    Total files found: 100
    Would be processed: 57
    Would be ignored: 43
*/

import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";

import { globby } from "globby";
import { getFileInfo, resolveConfigFile } from "prettier";

// Change this to the directory you want to check
const targetDir = path.resolve(process.cwd(), ".");

// Find git root to ensure we respect all .gitignore files
function findGitRoot(startPath) {
  try {
    const gitRoot = execSync("git rev-parse --show-toplevel", {
      cwd: startPath,
      encoding: "utf8",
    }).trim();
    return gitRoot;
  } catch {
    // Not in a git repo, use current directory
    return startPath;
  }
}

// Find all .gitignore files in the hierarchy
function findGitignoreFiles(gitRoot, targetDir) {
  const gitignoreFiles = [];
  let currentDir = targetDir;

  // Walk up from targetDir to gitRoot
  while (currentDir.startsWith(gitRoot)) {
    const gitignorePath = path.join(currentDir, ".gitignore");
    if (existsSync(gitignorePath)) {
      gitignoreFiles.push(path.relative(gitRoot, gitignorePath));
    }
    if (currentDir === gitRoot) break;
    currentDir = path.dirname(currentDir);
  }

  return gitignoreFiles;
}

async function analyzeFiles() {
  const gitRoot = findGitRoot(targetDir);
  console.log(`\n📂 Analyzing files in: ${targetDir}`);
  console.log(`📁 Git root: ${gitRoot}`);

  // Show which .gitignore files will be respected
  const gitignoreFiles = findGitignoreFiles(gitRoot, targetDir);
  if (gitignoreFiles.length > 0) {
    console.log(`\n🔍 Respecting .gitignore files:`);
    gitignoreFiles.reverse().forEach((file) => {
      console.log(`   - ${file}`);
    });
  }

  // Show which .prettierignore file will be used
  const prettierignorePath = path.join(targetDir, ".prettierignore");
  if (existsSync(prettierignorePath)) {
    console.log(
      `\n🎨 Using .prettierignore from: ${path.relative(gitRoot, prettierignorePath) || ".prettierignore"}`
    );
  } else {
    console.log(`\n⚠️  No .prettierignore found in ${targetDir}`);
  }
  console.log("");

  // Glob all files, respecting .gitignore by default
  // Use gitRoot as cwd so gitignore patterns work correctly from any subdirectory
  // Convert path prefix to POSIX path for globby compatibility (Windows uses backslashes)
  const relativeTargetDir = (path.relative(gitRoot, targetDir) || ".").replace(
    /\\/g,
    "/"
  );
  const pattern =
    relativeTargetDir === "." ? "**/{,.}*" : `${relativeTargetDir}/**/{,.}*`;

  const files = await globby(pattern, {
    cwd: gitRoot,
    gitignore: true,
    onlyFiles: true,
    absolute: false,
  });

  console.log(`Found ${files.length} files (respecting .gitignore)\n`);

  const results = [];

  for (const file of files) {
    const filePath = path.join(gitRoot, file);

    // Get the config file that would be used for this file
    const configFile = await resolveConfigFile(filePath);

    // Get file info including whether it would be ignored
    // Use .prettierignore from the current working directory (targetDir)
    const fileInfo = await getFileInfo(filePath, {
      ignorePath: path.join(targetDir, ".prettierignore"),
      resolveConfig: true,
    });

    // Store results with relative path from targetDir for cleaner display
    const displayPath = path.relative(targetDir, filePath);
    results.push({
      file: displayPath,
      configFile: configFile
        ? path.relative(gitRoot, configFile)
        : "none (defaults)",
      ignored: fileInfo.ignored,
      inferredParser: fileInfo.inferredParser,
    });
  }

  // Group by ignored status
  const processedFiles = results
    .filter((r) => !r.ignored)
    .sort((a, b) => a.file.localeCompare(b.file));
  const ignoredFiles = results
    .filter((r) => r.ignored)
    .sort((a, b) => a.file.localeCompare(b.file));

  console.log(
    `\n✅ Files that WOULD BE PROCESSED (${processedFiles.length}):\n`
  );
  console.log("─".repeat(80));
  processedFiles.forEach(({ file, configFile, inferredParser }) => {
    console.log(`📄 ${file}`);
    console.log(`   Config: ${configFile}`);
    console.log(`   Parser: ${inferredParser || "unknown"}`);
    console.log("");
  });

  console.log(`\n🚫 Files that WOULD BE IGNORED (${ignoredFiles.length}):\n`);
  console.log("─".repeat(80));
  ignoredFiles.forEach(({ file, _configFile }) => {
    console.log(`📄 ${file}`);
  });

  // Summary
  console.log("\n" + "═".repeat(80));
  console.log("📊 SUMMARY");
  console.log("═".repeat(80));
  console.log(`Total files found: ${results.length}`);
  console.log(`Would be processed: ${processedFiles.length}`);
  console.log(`Would be ignored: ${ignoredFiles.length}`);
  console.log("");
}

analyzeFiles().catch(console.error);
