# End-to-End Cypress Tests for Konveyor UI

This directory contains Cypress-based end-to-end tests for the Konveyor UI.

## Quick Start

```sh
# From the repository root
npm clean-install
cd cypress
cp -i .env.example .env

# Run tests in interactive mode against localhost:9000
npm run e2e:open:local

# OR run tests headlessly
npm run e2e:run:local
```

## Requirements

- **Operating System**: Fedora or macOS recommended
- **Node.js**: Version 20 or above (see `engines` in root `package.json`)
- **Running Konveyor instance**: Either a local dev server, minikube, or external URL

## Running Tests Locally

### Against a Local Dev Server

The simplest way to run e2e tests during development is against your local webpack dev server.

**Step 1: Start the dev server** (from the repository root, in a separate terminal):

```sh
npm run start:dev
```

This starts the UI at `http://localhost:9000` with proxy connections to your Konveyor backend.

**Step 2: Run the tests** (from the `cypress/` directory):

```sh
# Interactive mode - opens the Cypress Test Runner UI
npm run e2e:open:local

# Headless mode - runs tests in the terminal
npm run e2e:run:local

# Run a specific test file
npm run e2e:run:local -- --spec "e2e/tests/controls/stakeholder.test.ts"
```

### Against Minikube

If you have Konveyor deployed on minikube:

```sh
# Ensure minikube is running and Konveyor is deployed
minikube status

# Run tests using the minikube IP
npm run e2e:run:minikube

# OR with interactive mode
npm run e2e:open:minikube
```

### Against an External URL

To run tests against any Konveyor instance (staging, production, or remote):

```sh
# Using command line config override
npm run e2e:run:local -- --config baseUrl=https://your-konveyor-instance.example.com

# OR set the environment variable
CYPRESS_BASE_URL=https://your-instance.example.com npm run e2e:run:local
```

You can also set `CYPRESS_BASE_URL` in your `cypress/.env` file for persistent configuration.

## Environment Configuration

### Setting Up Your Environment

1. **Copy the example environment file**:

   ```sh
   cp cypress/.env.example cypress/.env
   ```

2. **Edit `cypress/.env`** with your configuration:

   ```sh
   # Required for most tests
   CYPRESS_BASE_URL=http://localhost:9000
   CYPRESS_USER=admin
   CYPRESS_PASSWORD=Dog8code

   # Required for tests that need Git credentials
   CYPRESS_GIT_USER=your-git-username
   CYPRESS_GIT_PASSWORD=your-git-token

   # Required for initial login tests when auth is enabled
   CYPRESS_INITIAL_PASSWORD=Passw0rd!
   CYPRESS_KEYCLOAK_ADMIN_PASSWORD=admin123
   ```

### Configuration Files

| File                | Purpose                                                |
| ------------------- | ------------------------------------------------------ |
| `cypress/.env`      | Local/secret configuration (gitignored)                |
| `cypress.config.ts` | Shared test settings, default env values, plugin setup |
| `.env.example`      | Template showing all available environment variables   |

### Required Parameters by Test Type

| Test File                                            | Required Parameters                                                                                                    |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `export_to_jira_datacenter.test.ts`                  | `jira_stage_datacenter_project_id`, `jira_stage_bearer_token`, `jira_stage_datacenter_url`                             |
| `export_to_jira_cloud.test.ts`                       | `jira_atlassian_cloud_project`, `jira_atlassian_cloud_email`, `jira_atlassian_cloud_token`, `jira_atlassian_cloud_url` |
| `source_analysis.test.ts`, `binary_analysis.test.ts` | `git_user`, `git_password`                                                                                             |

## Developer Workflow

As a UI developer, you can use the e2e tests to validate your changes before submitting a PR.

### Running Tests During Development

1. **Start your dev server** with your changes:

   ```sh
   npm run start:dev
   ```

2. **Run relevant tests** to validate your changes:

   ```sh
   cd cypress

   # Run a specific test related to your changes
   npm run e2e:run:local -- --spec "e2e/tests/controls/stakeholder.test.ts"

   # Or use interactive mode to debug
   npm run e2e:open:local
   ```

3. **Run the CI test suite** before submitting:

   ```sh
   # These are the tests that run in CI
   npm run e2e:run:local -- --spec "$(node scripts/findTierFiles.mjs ci)"
   ```

### Tips for Developers

- Use `npx dotenvx run -- npx cypress open` for interactive debugging with time-travel and DOM snapshots
- Focus on tests related to the area you're modifying
- The `@ci` tagged tests are fast and don't require external credentials
- Check the test output in `cypress/run/` for the summary report, screenshots and individual reports on failures

## QE Workflow

### Local Test Development

When developing or updating e2e tests:

1. **Set up your environment**:

   ```sh
   npm clean-install
   cd cypress
   cp .env.example .env
   # Edit .env with your credentials
   ```

2. **Run tests in interactive mode** for development against a minikube deployment:

   ```sh
   npm run e2e:open:minikube
   ```

3. **Use the Cypress Test Runner** to:
   - Select and run individual tests
   - View real-time test execution
   - Debug with time-travel and DOM inspection
   - Re-run tests as you make changes

### Running Full Test Suites

```sh
# Run all CI tests
npm run e2e:run:local -- --spec "$(node scripts/findTierFiles.mjs ci)"

# Run tier0 tests (smoke tests)
npm run e2e:run:local -- --spec "$(node scripts/findTierFiles.mjs tier0)"

# Run tier1 tests (requires git credentials)
npm run e2e:run:local -- --spec "$(node scripts/findTierFiles.mjs tier1)"

# Run multiple tiers
npm run e2e:run:local -- --spec "$(node scripts/findTierFiles.mjs tier0,tier1)"
```

### Pull Request Testing

1. **Create your test PR** against the `main` branch
2. **Sync your PR** with the upstream main branch
3. **Add the `RFR` label** when ready for review (Ready for Review)
4. **Force-push to trigger CI** after adding the label

If a reviewer needs to manually trigger the workflow:

- Go to the **Actions** tab
- Select **Pull request test workflow**
- Click **Run workflow** and select the PR branch

## CI Integration

### How CI Works

E2E tests run automatically in GitHub Actions when:

- A PR is opened/updated that modifies files in `cypress/` or `.github/workflows/e2e*.yaml`
- Code is pushed to the `main` branch affecting cypress files
- Manually triggered via the Actions tab

The CI workflow in [e2e-run-ui-tests.yaml](/.github/workflows/e2e-run-ui-tests.yaml):

1. Builds a UI image from the PR code
2. Deploys Konveyor on minikube with the test UI image
3. Runs the `@ci` and `@tier0` tagged tests
4. Uploads test reports as artifacts

### Pairing UI and Test PRs

When a UI change requires new or updated e2e tests, you can pair the PRs to run CI together.

**Scenario**: You have a UI PR that changes functionality and need to update e2e tests to match.

**Option 1: Same PR** (recommended for small changes)

Include both UI and test changes in the same PR. The CI will automatically build
the UI from your PR and run the updated tests.

**Option 2: Separate PRs with manual CI trigger**

For larger changes with separate UI and test PRs:

1. **Create your UI PR** in `tackle2-ui`
2. **Create your test PR** in `tackle2-ui` (tests are in the same repo)
3. **Manually trigger the e2e workflow**:
   - Go to **Actions** → **e2e - run UI tests on minikube**
   - Click **Run workflow**
   - Set `test_ref` to your test PR branch
   - Set `ui_image` to the image from your UI PR (if built) or keep default
4. **Link the PRs** in their descriptions for reviewers

**Option 3: Using workflow dispatch parameters**

For advanced testing scenarios, you can customize the CI run:

```yaml
# These parameters are available in the workflow_dispatch:
test_tags: "@ci,@tier0" # Which tests to run
test_ref: "your-test-branch" # Branch containing test changes
ui_image: "your-ui-image:tag" # Custom UI image to test against
bundle_image: "operator-bundle" # Custom operator bundle
```

### Viewing CI Results

- **Test reports** are uploaded as artifacts on the workflow run
- **Summary report** of all spec files and tests run, including embedded screenshots, in `run/report/index.html`
- **Screenshots** of failures are in `run/screenshots/`
- **JUnit XML reports** for CI integrations are in `run/report/junit/`

## Test Tags and Selective Execution

Tests are tagged for selective execution based on purpose, stability, and resource requirements.

### Running Tests by Tag

```sh
# Using the findTierFiles.mjs utility to filter spec files and only include those with relevant tests
npx dotenvx run -- npx cypress run --spec "$(node scripts/findTierFiles.mjs tier0)"

# Using environment variable
CYPRESS_INCLUDE_TAGS=@tier0 npm run e2e:run:local

# Multiple tags
CYPRESS_INCLUDE_TAGS=@tier0,@tier1 npm run e2e:run:local
```

### Tag Definitions

#### `@ci` - Continuous Integration Tests

- **Purpose**: Runs on minikube for PR validation via [Konveyor CI](https://github.com/konveyor/ci)
- **Constraints**:
  - Limited resources (minikube environment)
  - Cannot use tests requiring external credentials
  - Time-constrained (must complete reasonably quickly)
- **Tests Include**:
  - Login and navigation validation
  - Business service CRUD
  - Job function CRUD
  - Stakeholder, stakeholder group, tag, and archetype CRUD operations
  - Application assessment, review, and analysis with effort and issues validation

**Usage**:

```bash
npm run e2e:run:local -- --spec "$(node scripts/findTierFiles.mjs ci)"
```

#### `@tier0` - Basic Sanity Tests

- **Purpose**: Core smoke tests for critical functionality
- **Runs on**: Stage, production, and nightly on [Konveyor CI](https://github.com/konveyor/ci)
- **Tests Include**:
  - Custom migration targets CRUD and validation
  - Source analysis on bookserver app (without credentials)
  - Source + dependency analysis validation
  - Migration waves CRUD and application association

**Usage**:

```bash
npm run e2e:run:local -- --spec "$(node scripts/findTierFiles.mjs tier0)"
```

#### `@tier1` - Analysis Tests with Credentials

- **Purpose**: Comprehensive analysis tests requiring external credentials
- **Runs on**: Nightly on [Konveyor CI](https://github.com/konveyor/ci)
- **Tests Include**:
  - Binary analysis with Git credentials
  - Source code analysis with credentials
  - Node.js application analysis
  - Python application analysis
  - Upload binary analysis

**Required Config**: Tests need `git_user` and `git_password` configured in `cypress.config.ts`

**Usage**:

```bash
npm run e2e:run:local -- --spec "$(node scripts/findTierFiles.mjs tier1)"
```

#### `@tier2` - Comprehensive CRUD Tests

- **Purpose**: Full CRUD coverage for all features
- **Test Areas**: Administration (credentials, repositories, questionnaires), application inventory, controls, custom metrics, migration waves, task manager, RBAC, and analysis features

**Usage**:

```bash
npm run e2e:run:local -- --spec "$(node scripts/findTierFiles.mjs tier2)"
```

#### `@tier3` - Sorting and Filtering Tests

- **Purpose**: Validate sorting, filtering, and UI interactions
- **Tests Include**:
  - Job function filters
  - Tag filters on application details
  - Manual package selection for analysis
  - Analysis with proxy configuration

**Usage**:

```bash
npm run e2e:run:local -- --spec "$(node scripts/findTierFiles.mjs tier3)"
```

#### `@tier4` - Load and Performance Tests

- **Purpose**: Load testing and performance validation
- **Tests Include**:
  - Bulk analysis operations
  - Large dataset handling
  - Performance benchmarks

**Usage**:

```bash
npm run e2e:run:local -- --spec "$(node scripts/findTierFiles.mjs tier4)"
```

#### `@interop` - Interoperability Tests

- **Purpose**: Used by interOp team for testing on ROSA, ROSA-STS, and ARO clusters
- **Tests Include**:
  - Source control credentials CRUD
  - Custom migration targets CRUD
  - Stakeholder CRUD operations

**Usage**:

```bash
npm run e2e:run:local -- --spec "$(node scripts/findTierFiles.mjs interop)"
```

## Code Formatting

Husky and lint-staged automatically format staged files on commit.

```sh
# Fix formatting
npm run lint:fix

# Format with prettier
npm run format
```

## License Header Management

```sh
# Check license headers
npx license-check-and-add check

# Add missing license headers
npx license-check-and-add add
```

## Git Branch Mapping

| Branch      | Mapping                     |
| ----------- | --------------------------- |
| release-0.6 | MTA 7.2.1                   |
| release-0.7 | MTA 7.3.0                   |
| release-0.8 | MTA 8.0.0                   |
| main        | Upstream development branch |

## Code of Conduct

Refer to Konveyor's [Code of Conduct](https://github.com/konveyor/community/blob/main/CODE_OF_CONDUCT.md)
