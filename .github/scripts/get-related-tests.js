#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Script to determine which Cypress tests should run based on changed files in a PR
 *
 * Usage: node get-related-tests.js <base-branch> <current-branch>
 * Output: Space-separated list of test file patterns
 */

const MAPPING_FILE = path.join(__dirname, '..', 'test-mapping.json');

function loadMapping() {
  try {
    const content = fs.readFileSync(MAPPING_FILE, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error loading mapping file:', error.message);
    process.exit(1);
  }
}

function getChangedFiles(baseBranch, currentBranch) {
  try {
    // Get list of changed files between branches
    const cmd = `git diff --name-only ${baseBranch}...${currentBranch}`;
    const output = execSync(cmd, { encoding: 'utf8' });
    return output.trim().split('\n').filter(Boolean);
  } catch (error) {
    console.error('Error getting changed files:', error.message);
    // If git diff fails (e.g., in PR from fork), try getting changed files from PR
    try {
      const cmd = `git diff --name-only origin/${baseBranch}...HEAD`;
      const output = execSync(cmd, { encoding: 'utf8' });
      return output.trim().split('\n').filter(Boolean);
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError.message);
      return [];
    }
  }
}

function matchTestsForChangedFiles(changedFiles, mapping) {
  const testPatterns = new Set();
  let hasDevPageChanges = false;

  // Always include default tests
  if (mapping.defaultTests) {
    mapping.defaultTests.forEach(pattern => testPatterns.add(pattern));
  }

  changedFiles.forEach(file => {
    // Check if this is a dev page file
    if (file.startsWith('client/src/app/pages/')) {
      hasDevPageChanges = true;

      // Find matching patterns in the mapping
      Object.entries(mapping.mappings).forEach(([devPath, testPatternsList]) => {
        if (file.startsWith(devPath)) {
          testPatternsList.forEach(pattern => testPatterns.add(pattern));
        }
      });
    }

    // If a test file itself changed, include it
    if (file.startsWith('cypress/e2e/tests/') && file.endsWith('.test.ts')) {
      testPatterns.add(file);
    }

    // If cypress models or views changed, include related tests
    if (file.startsWith('cypress/e2e/models/')) {
      // Extract the category (administration, migration, etc.)
      const parts = file.split('/');
      if (parts.length >= 4) {
        const category = parts[3]; // e.g., "administration", "migration"
        testPatterns.add(`cypress/e2e/tests/${category}/**/*.test.ts`);
      }
    }

    if (file.startsWith('cypress/e2e/views/')) {
      // Views are shared, so we might need to run more tests
      // For now, we'll be conservative and include common tests
      testPatterns.add('cypress/e2e/tests/ci.test.ts');
      testPatterns.add('cypress/e2e/tests/login.test.ts');
    }
  });

  // If no specific dev page changes were detected but there are other changes,
  // we might want to run all tests (or a broader set)
  if (!hasDevPageChanges && testPatterns.size === (mapping.defaultTests?.length || 0)) {
    // Check if there are significant changes that warrant running all tests
    const hasSignificantChanges = changedFiles.some(file =>
      file.startsWith('client/src/') ||
      file.startsWith('cypress/') ||
      file.includes('package.json') ||
      file.includes('tsconfig')
    );

    if (hasSignificantChanges) {
      console.log('No specific page mappings found but significant changes detected');
    }
  }

  return Array.from(testPatterns);
}

function expandGlobPatterns(patterns) {
  const expandedFiles = new Set();

  patterns.forEach(pattern => {
    try {
      // Use glob to find matching files
      const cmd = `find . -path "./${pattern}" -type f 2>/dev/null || true`;
      const output = execSync(cmd, { encoding: 'utf8', cwd: process.cwd() });
      const files = output.trim().split('\n').filter(Boolean);

      if (files.length > 0) {
        files.forEach(file => {
          // Remove leading "./"
          expandedFiles.add(file.replace(/^\.\//, ''));
        });
      } else {
        // If no files found, keep the pattern (might be valid for cypress)
        expandedFiles.add(pattern);
      }
    } catch (error) {
      // If expansion fails, keep the original pattern
      expandedFiles.add(pattern);
    }
  });

  return Array.from(expandedFiles);
}

function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: node get-related-tests.js <base-branch> <current-branch>');
    process.exit(1);
  }

  const [baseBranch, currentBranch] = args;
  const expandGlobs = args.includes('--expand');

  console.log(`Analyzing changes between ${baseBranch} and ${currentBranch}...`);

  const mapping = loadMapping();
  const changedFiles = getChangedFiles(baseBranch, currentBranch);

  if (changedFiles.length === 0) {
    console.log('No changed files detected');
    // Return default tests if no changes detected
    const defaults = mapping.defaultTests || [];
    console.log('TEST_PATTERNS=' + defaults.join(' '));
    return;
  }

  console.log(`Found ${changedFiles.length} changed files:`);
  changedFiles.forEach(file => console.log(`  - ${file}`));

  const testPatterns = matchTestsForChangedFiles(changedFiles, mapping);

  console.log(`\nMatched ${testPatterns.length} test patterns:`);
  testPatterns.forEach(pattern => console.log(`  - ${pattern}`));

  if (expandGlobs) {
    const expandedTests = expandGlobPatterns(testPatterns);
    console.log(`\nExpanded to ${expandedTests.length} test files:`);
    expandedTests.forEach(file => console.log(`  - ${file}`));
    console.log('\nTEST_PATTERNS=' + expandedTests.join(' '));
  } else {
    console.log('\nTEST_PATTERNS=' + testPatterns.join(' '));
  }
}

main();
