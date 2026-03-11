/**
 * GitHub issue status checker for Cypress tests
 *
 * This utility checks GitHub issue status and conditionally skips tests
 * if issues are still open.
 */

export type GitHubIssueState = "open" | "closed";

// GitHub issue from API response
export interface GitHubIssue {
  id: number;
  number: number;
  state: GitHubIssueState;
  title: string;
  html_url: string;
  user: {
    login: string;
  };
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  body?: string;
  labels?: Array<{
    name: string;
    color: string;
  }>;
}

export interface GitHubAuth {
  token: string; // GitHub personal access token or GitHub Actions token
}

export interface GitHubConfig {
  owner: string;
  auth: GitHubAuth;
  apiUrl?: string; // Defaults to api.github.com
}

export interface GitHubIssueCheckOptions {
  issueNumber: number;
  githubConfig: GitHubConfig;
  repo: string;
}

const githubConfig: GitHubConfig = {
  owner: "konveyor",
  auth: {
    token: Cypress.env("github_token"),
  },
};

/**
 * Fetches a GitHub issue by its number using Cypress request
 *
 * @param issueNumber - The GitHub issue number (e.g., 123)
 * @param githubConfig - GitHub repository configuration
 * @param repo - Repository name
 * @returns Cypress chainable with the GitHub issue
 */
export function fetchGitHubIssue(
  issueNumber: number,
  githubConfig: GitHubConfig,
  repo: string
): Cypress.Chainable<GitHubIssue> {
  const { owner, auth, apiUrl = "https://api.github.com" } = githubConfig;
  const url = `${apiUrl}/repos/${owner}/${repo}/issues/${issueNumber}`;

  return cy
    .request({
      url,
      method: "GET",
      headers: {
        Authorization: `token ${auth.token}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "Cypress-GitHub-Utils",
      },
      failOnStatusCode: false,
    })
    .then((response) => {
      if (response.status >= 400) {
        throw new Error(
          `Failed to fetch GitHub issue #${issueNumber}: ${response.status} ${response.statusText}`
        );
      }
      return response.body as GitHubIssue;
    });
}

/**
 * Checks if a GitHub issue is open by querying the GitHub API
 *
 * @param options - Configuration options for the GitHub issue check
 * @returns Cypress chainable boolean indicating if the issue is open
 *
 */
export function isGitHubIssueOpen(
  options: GitHubIssueCheckOptions
): Cypress.Chainable<boolean> {
  const { issueNumber, githubConfig, repo } = options;

  let state: GitHubIssueState;
  let isOpen: boolean;

  return fetchGitHubIssue(issueNumber, githubConfig, repo)
    .then((issue) => {
      state = issue.state;
      isOpen = state === "open";
    })
    .then(() => {
      cy.log(
        `GitHub issue #${issueNumber} (${githubConfig.owner}/${repo}): ${state.toUpperCase()}`
      );
    })
    .then(() => isOpen);
}

/**
 * Use as a before hook to skip all tests in a suite if GitHub issue is open
 *
 * @param options - Configuration options for the GitHub issue check
 */
export function checkGitHubBeforeTest(options: GitHubIssueCheckOptions): void {
  before(function () {
    isGitHubIssueOpen(options).then((isOpen) => {
      if (isOpen) {
        cy.log(
          `Skipping test - GitHub issue #${options.issueNumber} is still open`
        );
        this.skip();
      }
    });
  });
}

/**
 * Check GitHub issue status inside an individual test and skip if open
 *
 * @param options - Configuration options for the GitHub issue check
 * @param context - Mocha test context (this)
 *
 * @example
 * ```typescript
 * it("my test", function (this: Mocha.Context) {
 *   checkGitHubInTest({
 *     issueNumber: 123,
 *     githubConfig: {
 *       owner: "konveyor",
 *       auth: { token: Cypress.env("github_token") }
 *     },
 *     repo: "tackle2-ui"
 *   }, this);
 *
 *   cy.log("Test runs only if GitHub issue is closed");
 * });
 * ```
 */
export function checkGitHubInTest(
  options: GitHubIssueCheckOptions,
  context: Mocha.Context
): void {
  isGitHubIssueOpen(options).then((isOpen) => {
    if (isOpen) {
      cy.log(
        `Skipping test - GitHub issue #${options.issueNumber} is still open`
      );
      context.skip();
    }
  });
}
