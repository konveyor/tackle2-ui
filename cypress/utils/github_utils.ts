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
  username: string;
  password: string;
  apiUrl?: string; // Defaults to api.github.com
}

export interface GitHubIssueOptions {
  issueNumber: number;
  repo: string;
}

const githubConfig: GitHubConfig = {
  owner: "konveyor",
  username: String(Cypress.env("git_user") ?? "").trim(),
  password: String(Cypress.env("git_password") ?? "").trim(),
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
  const {
    owner,
    username,
    password,
    apiUrl = "https://api.github.com",
  } = githubConfig;
  const url = `${apiUrl}/repos/${owner}/${repo}/issues/${issueNumber}`;

  // Create Basic Auth credentials
  const credentials = btoa(`${username}:${password}`);

  return cy
    .request({
      url,
      method: "GET",
      headers: {
        Authorization: `Basic ${credentials}`,
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
  const { issueNumber, repo } = options;

  let state: GitHubIssueState;
  let isOpen: boolean;

  // Validate credentials BEFORE entering async context so it always throws
  const { username, password } = githubConfig;
  if (!username || !password) {
    throw new Error("Missing Cypress env `git_user` or `git_password`");
  }

  return fetchGitHubIssue(issueNumber, repo)
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
 * Check GitHub issue status inside an individual test
 *
 * @param options - Configuration options for the GitHub issue check
 * @returns Cypress chainable boolean indicating if the issue is open
 *
 * @example
 * ```
 * it("test name", function () {
    checkGitHubInTest({ issueNumber: X, repo: "Y" }).then((isOpen) => {
      if (isOpen) {
        this.skip();
      }
      // ALL your test code must go here inside this .then() callback
      // Otherwise it will execute before this.skip() is called
      cy.log("This test runs only if issue is closed");
    });
   });
 * ```
 */
export function checkGitHubInTest(
  options: GitHubIssueOptions
): Cypress.Chainable<boolean> {
  return isGitHubIssueOpen(options);
}

/**
 * Use as a before hook to skip all tests in a suite if GitHub issue is open
 *
export function checkGitHubBeforeTest(options: GitHubIssueOptions): void {
}
*/
