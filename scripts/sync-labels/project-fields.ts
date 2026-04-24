/**
 * project-fields.ts
 *
 * GitHub Projects V2 GraphQL layer.
 *
 * Two query strategies are provided:
 *
 *  REPO_FIELDS_QUERY / parseRepoIssues
 *    Preferred when a specific repo is known.  Queries issues directly from
 *    the repository so the repo filter lives in the GraphQL variables, then
 *    plucks field values from each issue's projectItems for the target project.
 *
 *  FIELDS_QUERY / parseProjectItems
 *    Used for the --all-repos case.  Queries all items in the project and
 *    returns every issue regardless of repository.
 *
 * No HTTP calls are made here.  The caller supplies the GraphQL execution
 * function and passes raw responses to the parser functions.
 */

import type { ProjectItemFields } from "./label-projection";
import { FIELD_NAMES } from "./mappings";

// ── Shared field-value extraction helper ──────────────────────────────────────

function extractFields(
  fieldValueNodes: Array<RawFieldValue | Record<string, never>>
): { fields: ProjectItemFields; unknownFieldNames: string[] } {
  const fields: ProjectItemFields = {};
  const unknownFieldNames: string[] = [];

  for (const fv of fieldValueNodes) {
    const fieldName = (fv as RawFieldValue).field?.name;
    const fieldValue = (fv as RawFieldValue).name;

    if (!fieldName || !fieldValue) continue;

    if (fieldName === FIELD_NAMES.status) {
      fields.status = fieldValue;
    } else if (fieldName === FIELD_NAMES.priority) {
      fields.priority = fieldValue;
    } else if (!unknownFieldNames.includes(fieldName)) {
      unknownFieldNames.push(fieldName);
    }
  }

  return { fields, unknownFieldNames };
}

// ── Shared raw field-value type ───────────────────────────────────────────────

export interface RawFieldValue {
  name?: string;
  field?: {
    id?: string;
    name?: string;
  };
}

/** The fieldValues fragment used in both queries. */
const FIELD_VALUES_FRAGMENT = /* graphql */ `
  fieldValues(first: 20) {
    nodes {
      ... on ProjectV2ItemFieldSingleSelectValue {
        name
        field {
          ... on ProjectV2SingleSelectField {
            id
            name
          }
        }
      }
    }
  }
`;

// ── Strategy 1: Repo-scoped query (preferred) ─────────────────────────────────

/**
 * Queries issues from a specific repository and fetches their project item
 * field values via the `projectItems` connection on each issue.  The repo
 * filter is expressed as a GraphQL variable, not post-processing.
 *
 * Variables:
 *   $org    (String!) — organization login
 *   $repo   (String!) — repository name, e.g. "tackle2-ui"
 *   $cursor (String)  — pagination cursor (null for first page)
 *
 * Client-side: filter project items by `project.number` to isolate the
 * target project, since `projectItems` has no project-number filter argument.
 */
export const REPO_FIELDS_QUERY = /* graphql */ `
  query RepoIssues($org: String!, $repo: String!, $cursor: String) {
    organization(login: $org) {
      repository(name: $repo) {
        issues(first: 50, after: $cursor) {
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            number
            title
            url
            state
            labels(first: 30) {
              nodes { name }
            }
            projectItems(includeArchived: false, first: 10) {
              nodes {
                project {
                  number
                  title
                }
                ${FIELD_VALUES_FRAGMENT}
              }
            }
          }
        }
      }
    }
  }
`;

export interface RawRepoProjectItem {
  project: { number: number; title: string };
  fieldValues: { nodes: Array<RawFieldValue | Record<string, never>> };
}

export interface RawRepoIssueNode {
  number: number;
  title: string;
  url: string;
  state: "OPEN" | "CLOSED";
  labels: { nodes: Array<{ name: string }> };
  projectItems: { nodes: RawRepoProjectItem[] };
}

export interface RawRepoResponse {
  organization: {
    repository: {
      issues: {
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
        nodes: RawRepoIssueNode[];
      };
    };
  };
}

/**
 * Convert raw repo-query issue nodes into normalized ProjectIssueItem records.
 * Issues that are not in the target project are skipped.
 *
 * @param issueNodes   Raw issue nodes from the REPO_FIELDS_QUERY response.
 * @param projectNumber  The project number to match against each issue's projectItems.
 * @param owner        Repository owner login (already known from query variables).
 * @param repo         Repository name (already known from query variables).
 */
export function parseRepoIssues(
  issueNodes: RawRepoIssueNode[],
  projectNumber: number,
  owner: string,
  repo: string
): { items: ProjectIssueItem[]; projectTitle: string } {
  const items: ProjectIssueItem[] = [];
  let projectTitle = "";

  for (const issue of issueNodes) {
    const projectItem = issue.projectItems.nodes.find(
      (pi) => pi.project.number === projectNumber
    );
    if (!projectItem) continue;

    if (!projectTitle) projectTitle = projectItem.project.title;

    const currentLabels = issue.labels.nodes.map((l) => l.name);
    const { fields, unknownFieldNames } = extractFields(
      projectItem.fieldValues.nodes
    );

    items.push({
      issueNumber: issue.number,
      issueTitle: issue.title,
      issueUrl: issue.url,
      issueState: issue.state,
      repo,
      owner,
      currentLabels,
      fields,
      unknownFieldNames,
    });
  }

  return { items, projectTitle };
}

// ── Strategy 2: Project-scoped query (all repos) ──────────────────────────────

/**
 * Paginated query that fetches all items in a GitHub Project V2.
 * Used for the --all-repos case where no specific repository is targeted.
 *
 * Variables:
 *   $org    (String!) — organization login
 *   $number (Int!)    — project number
 *   $cursor (String)  — pagination cursor (null for first page)
 */
export const FIELDS_QUERY = /* graphql */ `
  query ProjectItems($org: String!, $number: Int!, $cursor: String) {
    organization(login: $org) {
      projectV2(number: $number) {
        title
        items(first: 50, after: $cursor) {
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            id
            type
            content {
              ... on Issue {
                number
                title
                url
                state
                repository {
                  name
                  owner { login }
                }
                labels(first: 30) {
                  nodes { name }
                }
              }
            }
            ${FIELD_VALUES_FRAGMENT}
          }
        }
      }
    }
  }
`;

export interface RawIssueContent {
  number: number;
  title: string;
  url: string;
  state: "OPEN" | "CLOSED";
  repository: { name: string; owner: { login: string } };
  labels: { nodes: Array<{ name: string }> };
}

export interface RawProjectItem {
  id: string;
  type: string;
  content: RawIssueContent | null;
  fieldValues: { nodes: Array<RawFieldValue | Record<string, never>> };
}

export interface RawProjectResponse {
  organization: {
    projectV2: {
      title: string;
      items: {
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
        nodes: RawProjectItem[];
      };
    };
  };
}

// ── Normalized output type ────────────────────────────────────────────────────

/** A project issue item normalized for use by the label sync logic. */
export interface ProjectIssueItem {
  issueNumber: number;
  issueTitle: string;
  issueUrl: string;
  issueState: "OPEN" | "CLOSED";
  /** Repository name (without owner), e.g. "tackle2-ui". */
  repo: string;
  /** Repository owner login, e.g. "konveyor". */
  owner: string;
  /** All label names currently on the issue. */
  currentLabels: string[];
  /** Project field values extracted from the project item. */
  fields: ProjectItemFields;
  /**
   * Field names found in fieldValues that did not match any of the known
   * field names (Status, Priority, Kind/Type).
   */
  unknownFieldNames: string[];
}

/**
 * Convert raw project-query item nodes into normalized ProjectIssueItem records.
 * Used by the --all-repos path.
 */
export function parseProjectItems(nodes: RawProjectItem[]): ProjectIssueItem[] {
  const results: ProjectIssueItem[] = [];

  for (const node of nodes) {
    if (node.type !== "ISSUE" || !node.content) continue;
    const content = node.content;
    const currentLabels = content.labels.nodes.map((l) => l.name);
    const { fields, unknownFieldNames } = extractFields(node.fieldValues.nodes);

    results.push({
      issueNumber: content.number,
      issueTitle: content.title,
      issueUrl: content.url,
      issueState: content.state,
      repo: content.repository.name,
      owner: content.repository.owner.login,
      currentLabels,
      fields,
      unknownFieldNames,
    });
  }

  return results;
}
