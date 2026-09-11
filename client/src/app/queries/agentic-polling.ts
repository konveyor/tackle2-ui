import type { QueryStatus } from "@tanstack/react-query";

/**
 * Polling policy shared by the agentic `useFetch*` hooks.
 *
 * The agentic pages poll the Hub every few seconds. When the Hub is
 * misconfigured (typically its ServiceAccount is denied by RBAC), the default
 * react-query behaviour — three exponential-backoff retries per fetch, then
 * poll again — keeps the query "fetching" almost continuously, so the tables
 * render a spinner instead of the error. Bound the retries and pause polling
 * while the query is errored; `refetchOnWindowFocus` and the error state's
 * Retry button bring it back.
 *
 * Used inline rather than spread into the options object: a pre-typed
 * `refetchInterval` callback would feed `unknown` into react-query's `TData`
 * inference and erase the hook's return type.
 */
export const AGENTIC_QUERY_RETRY = 1;

export const pollUnlessErrored = (
  query: { state: { status: QueryStatus } },
  refetchInterval: number | false
): number | false => (query.state.status === "error" ? false : refetchInterval);
