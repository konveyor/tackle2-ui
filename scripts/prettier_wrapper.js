#!/usr/bin/env node
/*
  A prettier wrapper that properly respects .gitignore and .prettierignore files
  throughout the file tree when globbing files.

  Usage:
    ./prettier_wrapper.js [options] [files/directories/globs...]

  Options:
    --check         Check if files are formatted (exit with error if not)
    --write         Write formatted output back to files
    --list-different List files that are not formatted
    --ignore-path <path>  Path to ignore file (default: .prettierignore)

  Examples:
    ./prettier_wrapper.js --check .
    ./prettier_wrapper.js --write "src/**\/*.ts"
    ./prettier_wrapper.js --check cypress/
*/

import { existsSync, readFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { globby } from "globby";
import * as prettier from "prettier";

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    check: false,
    write: false,
    listDifferent: false,
    ignorePath: null,
    paths: [],
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--check") {
      options.check = true;
    } else if (arg === "--write" || arg === "-w") {
      options.write = true;
    } else if (arg === "--list-different" || arg === "-l") {
      options.listDifferent = true;
    } else if (arg === "--ignore-path") {
      options.ignorePath = args[++i];
    } else if (!arg.startsWith("-")) {
      options.paths.push(arg);
    } else {
      console.error(`Unknown option: ${arg}`);
      process.exit(1);
    }
  }

  // Default to current directory if no paths specified
  if (options.paths.length === 0) {
    options.paths = ["."];
  }

  // Default to --check if neither --check nor --write specified
  if (!options.check && !options.write && !options.listDifferent) {
    options.check = true;
  }

  return options;
}

// Find project root by walking up to find package.json
// For monorepos, finds the root package.json (one with workspaces or topmost)
function findProjectRoot(startPath) {
  let currentDir = startPath;
  let lastPackageJsonDir = null;

  // Walk up directory tree looking for package.json files
  while (true) {
    const packageJsonPath = path.join(currentDir, "package.json");

    if (existsSync(packageJsonPath)) {
      lastPackageJsonDir = currentDir;

      // Check if this is a workspace root
      try {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));

        // npm/yarn workspaces
        if (packageJson.workspaces) {
          return currentDir;
        }

        // pnpm workspaces (check for pnpm-workspace.yaml)
        const pnpmWorkspacePath = path.join(currentDir, "pnpm-workspace.yaml");
        if (existsSync(pnpmWorkspacePath)) {
          return currentDir;
        }

        // lerna monorepo
        const lernaPath = path.join(currentDir, "lerna.json");
        if (existsSync(lernaPath)) {
          return currentDir;
        }
      } catch {
        // If we can't read package.json, continue searching
      }
    }

    const parentDir = path.dirname(currentDir);

    // Stop if we've reached the root or parent is the same (can't go up further)
    if (parentDir === currentDir) {
      break;
    }

    currentDir = parentDir;
  }

  // Return the last package.json directory we found, or the start path if none found
  return lastPackageJsonDir || startPath;
}

// Find all .prettierignore files in the tree from targetDir up to projectRoot
function findPrettierignoreFiles(projectRoot, targetDir) {
  const prettierignoreFiles = [];
  let currentDir = targetDir;

  // Walk up from targetDir to projectRoot
  while (currentDir.startsWith(projectRoot)) {
    const prettierignorePath = path.join(currentDir, ".prettierignore");
    if (existsSync(prettierignorePath)) {
      prettierignoreFiles.push(prettierignorePath);
    }

    if (currentDir === projectRoot) break;
    currentDir = path.dirname(currentDir);
  }

  return prettierignoreFiles;
}

// Get all files matching the input paths
async function getFiles(inputPaths, projectRoot, cwd, ignorePath) {
  const allFiles = new Set();

  // Find all .prettierignore files in the hierarchy
  let prettierignoreFiles = findPrettierignoreFiles(projectRoot, cwd);

  // Use custom ignore path if provided
  if (ignorePath) {
    const resolvedIgnorePath = path.resolve(cwd, ignorePath);
    if (existsSync(resolvedIgnorePath)) {
      prettierignoreFiles = [resolvedIgnorePath];
    } else {
      console.warn(`Warning: Ignore path ${ignorePath} does not exist`);
    }
  }

  console.log(`\n📂 Working directory: ${cwd}`);
  console.log(`📦 Project root: ${projectRoot}`);
  console.log(
    `\n🎨 Using ${prettierignoreFiles.length} .prettierignore file(s):`
  );

  if (prettierignoreFiles.length > 0) {
    prettierignoreFiles.forEach((file) => {
      console.log(`   - ${path.relative(projectRoot, file)}`);
    });
  }

  console.log("");

  for (const inputPath of inputPaths) {
    const resolvedPath = path.resolve(cwd, inputPath);

    // Convert to pattern for globby
    let patterns;
    if (existsSync(resolvedPath)) {
      const stats = await import("node:fs/promises").then((fs) =>
        fs.stat(resolvedPath)
      );
      if (stats.isDirectory()) {
        // Directory: match all files recursively
        const relPath = path
          .relative(projectRoot, resolvedPath)
          .replace(/\\/g, "/");
        patterns = relPath === "" ? ["**/*"] : [`${relPath}/**/*`];
      } else {
        // File: match exactly
        const relPath = path
          .relative(projectRoot, resolvedPath)
          .replace(/\\/g, "/");
        patterns = [relPath];
      }
    } else {
      // Treat as glob pattern
      patterns = [inputPath.replace(/\\/g, "/")];
    }

    // Glob files respecting .gitignore and .prettierignore
    const files = await globby(patterns, {
      cwd: projectRoot,
      gitignore: true,
      onlyFiles: true,
      absolute: false,
      ignoreFiles: prettierignoreFiles,
    });

    files.forEach((file) => allFiles.add(path.join(projectRoot, file)));
  }

  return Array.from(allFiles).sort();
}

// Check if file is formatted
async function checkFile(filePath) {
  try {
    const content = readFileSync(filePath, "utf8");

    // Get prettier config for this file
    const config = await prettier.resolveConfig(filePath);

    // Check if file would be ignored by prettier
    const fileInfo = await prettier.getFileInfo(filePath, {
      resolveConfig: true,
    });

    if (fileInfo.ignored || !fileInfo.inferredParser) {
      return { formatted: true, ignored: true };
    }

    // Check if file is formatted
    const formatted = await prettier.check(content, {
      ...config,
      filepath: filePath,
    });

    return { formatted, ignored: false };
  } catch (err) {
    return { error: err.message, ignored: false };
  }
}

// Format file
async function formatFile(filePath) {
  try {
    const content = readFileSync(filePath, "utf8");

    // Get prettier config for this file
    const config = await prettier.resolveConfig(filePath);

    // Check if file would be ignored by prettier
    const fileInfo = await prettier.getFileInfo(filePath, {
      resolveConfig: true,
    });

    if (fileInfo.ignored || !fileInfo.inferredParser) {
      return { changed: false, ignored: true };
    }

    // Format file
    const formatted = await prettier.format(content, {
      ...config,
      filepath: filePath,
    });

    // Check if content changed
    if (formatted === content) {
      return { changed: false, ignored: false };
    }

    // Write formatted content back
    await writeFile(filePath, formatted, "utf8");
    return { changed: true, ignored: false };
  } catch (err) {
    return { error: err.message, ignored: false };
  }
}

async function main() {
  const options = parseArgs();
  const cwd = process.cwd();
  const projectRoot = findProjectRoot(cwd);

  // Get all files to process
  const files = await getFiles(
    options.paths,
    projectRoot,
    cwd,
    options.ignorePath
  );

  if (files.length === 0) {
    console.log("No files found matching the patterns");
    return;
  }

  console.log(`Found ${files.length} file(s) to process\n`);

  const results = {
    total: files.length,
    checked: 0,
    formatted: 0,
    unchanged: 0,
    ignored: 0,
    errors: 0,
    unformatted: [],
  };

  // Process files
  for (const file of files) {
    const displayPath = path.relative(cwd, file);

    if (options.write) {
      const result = await formatFile(file);

      if (result.error) {
        console.error(`❌ ${displayPath}: ${result.error}`);
        results.errors++;
      } else if (result.ignored) {
        results.ignored++;
      } else if (result.changed) {
        console.log(`✏️  ${displayPath}`);
        results.formatted++;
      } else {
        results.unchanged++;
      }
    } else {
      // Check mode
      const result = await checkFile(file);

      if (result.error) {
        console.error(`❌ ${displayPath}: ${result.error}`);
        results.errors++;
      } else if (result.ignored) {
        results.ignored++;
      } else if (!result.formatted) {
        if (options.listDifferent) {
          console.log(displayPath);
        } else {
          console.log(`❌ ${displayPath}`);
        }
        results.unformatted.push(displayPath);
      } else {
        results.checked++;
      }
    }
  }

  // Print summary
  console.log("\n" + "═".repeat(80));
  console.log("📊 SUMMARY");
  console.log("═".repeat(80));

  if (options.write) {
    console.log(`Total files: ${results.total}`);
    console.log(`Formatted: ${results.formatted}`);
    console.log(`Unchanged: ${results.unchanged}`);
    console.log(`Ignored: ${results.ignored}`);
    console.log(`Errors: ${results.errors}`);
  } else {
    console.log(`Total files: ${results.total}`);
    console.log(`Formatted correctly: ${results.checked}`);
    console.log(`Not formatted: ${results.unformatted.length}`);
    console.log(`Ignored: ${results.ignored}`);
    console.log(`Errors: ${results.errors}`);
  }

  console.log("");

  // Exit with error if there were unformatted files or errors
  if (results.unformatted.length > 0 || results.errors > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
