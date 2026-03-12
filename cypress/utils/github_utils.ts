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

export interface GitHubConfig {
  owner: string;
  token: string;
  apiUrl?: string; // Defaults to api.github.com
}

export interface GitHubIssueOptions {
  issueNumber: number;
  repo: string;
  failOnError?: boolean;
}

const githubConfig: GitHubConfig = {
  owner: "konveyor",
  token: String(Cypress.env("github_token") ?? "").trim(),
};

/**
 * Fetches a GitHub issue by its number using Cypress request
 *
 * @param issueNumber - The GitHub issue number (e.g., 123)
 * @param repo - Repository name
 * @returns Cypress chainable with the GitHub issue
 */
export function fetchGitHubIssue(
  issueNumber: number,
  repo: string
): Cypress.Chainable<GitHubIssue> {
  const { owner, token, apiUrl = "https://api.github.com" } = githubConfig;
  const url = `${apiUrl}/repos/${owner}/${repo}/issues/${issueNumber}`;

  return cy
    .request({
      url,
      method: "GET",
      headers: {
        Authorization: `token ${token}`,
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
  options: GitHubIssueOptions
): Cypress.Chainable<boolean> {
  const { issueNumber, repo, failOnError = false } = options;

  // Validate token BEFORE entering async context so it always throws
  const { token } = githubConfig;
  if (!token) {
    throw new Error("Missing Cypress env `github_token`");
  }

  return cy.wrap(
    new Cypress.Promise<boolean>((resolve, reject) => {
      fetchGitHubIssue(issueNumber, repo).then((issue) => {
        const state = issue.state;
        const isOpen = state === "open";
        cy.log(
          `GitHub issue #${issueNumber} (${githubConfig.owner}/${repo}): ${state.toUpperCase()}`
        );
        resolve(isOpen);
      });
    }).catch((error) => {
      if (failOnError) {
        throw error;
      }
      cy.log(`GitHub issue #${issueNumber} could not be checked`);
      return false;
    })
  );
}

/**
 * Check GitHub issue status inside an individual test and skip if open
 *
 * @param options - Configuration options for the GitHub issue check
 * @param context - Mocha test context (this)
 *
 * @example
 * ```
 * it("my test", function (this: Mocha.Context) {
 *   checkGitHubInTest(
 *   {
 *     issueNumber: 123,
 *     repo: "tackle2-ui"
 *   },
 *   this);
 *
 *   cy.log("Test runs only if GitHub issue is closed");
 * });
 * ```
 */
export function checkGitHubInTest(
  options: GitHubIssueOptions,
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
