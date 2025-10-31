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

## Tags and Tiers in Konveyor UI Tests

| Tag        | Purpose                                                | Typical Run               | Example Tests                                                          |
| ---------- | ------------------------------------------------------ | ------------------------- | ---------------------------------------------------------------------- |
| `@interOp` | Interoperability tests on ROSA, ARO, ROSA-STS clusters | InterOp team              | Source credentials CRUD, Migration Targets, Binary analysis, Wave CRUD |
| `@ci`      | Minimal CI sanity run                                  | GitHub Actions / Minikube | CRUD, assessment and review                                            |
| `@tier0`   | Basic sanity suite (stage/prod/nightly)                | Konveyor CI               | Credentials CRUD, Source analysis, Business service CRUD               |
| `@tier1`   | Extended analysis tests                                | Nightly CI                | Binary and source analysis with credentials                            |
| `@tier2`   | Full CRUD coverage                                     | Automation / CI           | Entity CRUD operations                                                 |
| `@tier3`   | Sorting/filtering validation                           | Automation                | Filter/sort tests                                                      |
| `@tier4`   | Load and performance tests                             | Automation                | Load tests                                                             |

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

<!-- test GPG signing -->
