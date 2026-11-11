/**
 * The set of environment variables injected into the client SPA via `window._env`.
 *
 * Consumers should use the `ENV` export from `client/src/app/env.ts`.
 * Empty or unset values use the defaults shared by the client and dev server.
 */
export type ClientEnv = {
  NODE_ENV: "development" | "production" | "test";
  VERSION: string;

  /** Controls how mock data is injected on the client */
  MOCK: string;

  /** Enable devtools */
  DEVTOOLS: "on" | "off";

  /** UI upload file size limit in megabytes (MB), suffixed with "m" */
  UI_INGRESS_PROXY_BODY_SIZE: string;

  /** Allow clearing local maven artifact repository? Requires availability of RWX volumes for hub. */
  RWX_SUPPORTED: "true" | "false";

  /** Enable RBAC authentication/authorization */
  AUTH_REQUIRED: "true" | "false";

  /**
   * Show the agentic console (agent runs, agents, skills, workflows). Off
   * by default; a deployment opts in when its hub serves the agentic
   * endpoints, since the console is unusable without them.
   */
  AGENTIC_ENABLED: "true" | "false";

  /**
   * Allow steering a live agent from the run chat (free-text messages).
   * Off by default — the dev-preview HITL posture is read-only: watch the
   * transcript, don't inject instructions mid-run.
   */
  AGENTIC_STEER_ENABLED: "true" | "false";

  /** OIDC client ID for the UI */
  OIDC_CLIENT_ID: string;
};

/** Keep the production Caddy env.json.tmpl defaults in sync with this object. */
export const CLIENT_ENV_DEFAULTS: ClientEnv = {
  NODE_ENV: "production",
  VERSION: "99.0.0",
  MOCK: "off",
  DEVTOOLS: "off",
  UI_INGRESS_PROXY_BODY_SIZE: "500m",
  RWX_SUPPORTED: "true",
  AUTH_REQUIRED: "false",
  AGENTIC_ENABLED: "false",
  AGENTIC_STEER_ENABLED: "false",
  OIDC_CLIENT_ID: "web-ui",
};

/** Only expose the allowlisted client fields, never the rest of process.env. */
export const buildClientEnv = (
  env: Partial<Record<keyof ClientEnv, string>> = {}
): ClientEnv =>
  Object.fromEntries(
    Object.entries(CLIENT_ENV_DEFAULTS).map(([key, fallback]) => [
      key,
      env[key as keyof ClientEnv] || fallback,
    ])
  ) as ClientEnv;

/** JSON that can be embedded directly in an HTML script, without a JS string. */
export const serializeClientEnv = (env: ClientEnv): string =>
  JSON.stringify(env).replace(
    /[<>&\u2028\u2029]/g,
    (character) => `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`
  );
