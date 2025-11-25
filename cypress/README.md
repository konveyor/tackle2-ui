## End-to-End Cypress Tests for Konveyor UI

## Getting Started

### Requirements

Operating System — Fedora or macOS recommended

Node.js — Version 20 or above

You can install using native OS packages, Node.js downloads

### Install and Run Automation

1. Clone the repository and install dependencies

```sh
git clone https://github.com/konveyor/tackle2-ui.git
cd tackle2-ui
npm clean-install
```

2. Set up the Cypress environment

Copy the sample environment file:

```sh
cp cypress/.env.example cypress/.env
```

Update cypress/.env with your configuration:

CYPRESS_baseUrl → URL of your Konveyor instance

Credentials such as git_user, git_password (if required)

📝 Note:
.env holds local or secret configurations.
cypress.config.ts defines shared test settings across all environments.

3. Run the tests

All tests should be executed from the cypress directory:

```sh
cd cypress
npx cypress open
# OR
npx cypress run --spec e2e/tests/<test_name>.test.ts
```

### Required Parameters for Tests

Some tests depend on specific configuration values in cypress.config.ts.
Below is a summary of parameters per test type:

| Test File                                            | Required Parameters                                                                                                    |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `export_to_jira_datacenter.test.ts`                  | `jira_stage_datacenter_project_id`, `jira_stage_bearer_token`, `jira_stage_datacenter_url`                             |
| `export_to_jira_cloud.test.ts`                       | `jira_atlassian_cloud_project`, `jira_atlassian_cloud_email`, `jira_atlassian_cloud_token`, `jira_atlassian_cloud_url` |
| `source_analysis.test.ts`, `binary_analysis.test.ts` | `git_user`, `git_password`                                                                                             |

### Code Formatting Using Prettier

Husky and lint-staged automatically format staged files on commit.

Check formatting manually:

```sh
npm run lint
```

Fix formatting manually:

```sh
npm run lint:fix
```

### Pull Request Testing

Sync your PR with the upstream main branch.

PRs are tested against the environment before merging.

When ready, add the RFR label to mark the PR as “Ready for Review”.

After adding RFR, force-push the branch to trigger GitHub Actions.

If a reviewer needs to trigger the workflow manually:

Go to the Actions tab

Select Pull request test workflow

Click Run workflow

Select the PR branch → Run workflow

## Tag-Based Test Execution

This repository uses cypress-tags

```sh
CYPRESS_INCLUDE_TAGS=@tagName npx cypress run
```

Run multiple tags at once:

```sh
CYPRESS_INCLUDE_TAGS=@tier1,@tier2 npx cypress run
```

### Tag Overview

Tests are tagged for selective execution based on purpose, stability, and resource requirements.

### Finding and Running Tests by Tag

Use the `findTierFiles.js` utility to locate and run tests with specific tags:

```bash
# Find all tier0 tests
node cypress/scripts/findTierFiles.js tier0

# Run tests for a specific tier
npx cypress run --spec "$(node cypress/scripts/findTierFiles.js tier0)"

# Run tests for multiple tiers
npx cypress run --spec "$(node cypress/scripts/findTierFiles.js tier0,interop)"
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
npx cypress run --spec "$(node cypress/scripts/findTierFiles.js ci)"
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
npx cypress run --spec "$(node cypress/scripts/findTierFiles.js tier0)"
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
npx cypress run --spec "$(node cypress/scripts/findTierFiles.js tier1)"
```

#### `@tier2` - Comprehensive CRUD Tests

- **Purpose**: Full CRUD coverage for all features
- **Test Areas**: Administration (credentials, repositories, questionnaires), application inventory, controls, custom metrics, migration waves, task manager, RBAC, and analysis features

**Usage**:

```bash
npx cypress run --spec "$(node cypress/scripts/findTierFiles.js tier2)"
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
npx cypress run --spec "$(node cypress/scripts/findTierFiles.js tier3)"
```

#### `@tier4` - Load and Performance Tests

- **Purpose**: Load testing and performance validation
- **Tests Include**:
  - Bulk analysis operations
  - Large dataset handling
  - Performance benchmarks

**Usage**:

```bash
npx cypress run --spec "$(node cypress/scripts/findTierFiles.js tier4)"
```

#### `@interop` - Interoperability Tests

- **Purpose**: Used by interOp team for testing on ROSA, ROSA-STS, and ARO clusters
- **Tests Include**:
  - Source control credentials CRUD
  - Custom migration targets CRUD
  - Stakeholder CRUD operations

**Usage**:

```bash
npx cypress run --spec "$(node cypress/scripts/findTierFiles.js interop)"
```

### Running Multiple Tags

To run tests from multiple tiers in a single execution:

```bash
# Run tier0 and tier1 together
npx cypress run --spec "$(node cypress/scripts/findTierFiles.js tier0,tier1)"

# Run interop and tier0 tests
npx cypress run --spec "$(node cypress/scripts/findTierFiles.js tier0,interop)"
```

## License Header Management

Check license headers:

```shell
yarn license-check-and-add check
```

Add license headers:

```shell
yarn license-check-and-add add
```

## Code of Conduct

Refer to Konveyor's Code of Conduct

## Git Branch Mapping

| Branch      | Mapping                     |
| ----------- | --------------------------- |
| release-0.6 | MTA 7.2.1                   |
| release-0.7 | MTA 7.3.0                   |
| release-0.8 | MTA 8.0.0                   |
| main        | Upstream development branch |
