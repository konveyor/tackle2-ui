/**
 * The set of environment variables injected into the client SPA via `window._env`.
 *
 * Consumers should use the `ENV` export from `client/src/app/env.ts` rather
 * than reading `window._env` directly — that module applies defaults and filters
 * out empty strings left by unset env vars.
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

/**
 * Build the ClientEnv object for development by reading process.env.
 */
export const buildClientEnv = (
  env: ClientEnv = process.env as unknown as ClientEnv
): ClientEnv => ({
  NODE_ENV: env.NODE_ENV ?? "development",
  VERSION: env.VERSION ?? "99.0.0",
  MOCK: env.MOCK ?? "off",
  DEVTOOLS: env.DEVTOOLS ?? "off",
  UI_INGRESS_PROXY_BODY_SIZE: env.UI_INGRESS_PROXY_BODY_SIZE ?? "500m",
  RWX_SUPPORTED: env.RWX_SUPPORTED ?? "true",
  AUTH_REQUIRED: env.AUTH_REQUIRED ?? "false",
  // Off by default so the agentic console has zero impact on the rest of
  // the product unless explicitly opted in; matches Caddyfile.prod defaults.
  AGENTIC_ENABLED: env.AGENTIC_ENABLED ?? "false",
  AGENTIC_STEER_ENABLED: env.AGENTIC_STEER_ENABLED ?? "false",
  OIDC_CLIENT_ID: env.OIDC_CLIENT_ID ?? "web-ui",
});

/**
 * The ClientEnv object for the current environment.  In development, it is
 * built with {@link buildClientEnv}.  In production, this will be `undefined`,
 * since the ClientEnv object is handled by Caddy at request time.
 */
export const CLIENT_ENV =
  process.env.NODE_ENV === "development" ? buildClientEnv() : undefined;
