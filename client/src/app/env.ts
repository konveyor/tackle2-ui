import type { ClientEnv } from "@env/types";

const CLIENT_ENV_DEFAULTS: ClientEnv = {
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

// window._env is injected as a plain object:
//   - Production: Caddy's `templates` directive processes index.html at request time,
//     replacing {{env "VAR"}} expressions with the container's environment variables.
//   - Development: HtmlWebpackPlugin bakes the values in at compile time (see
//     rspack.dev.mts which substitutes the Go template placeholders before building).
//
// Empty strings (e.g. from unset env vars in prod) are filtered out so that
// CLIENT_ENV_DEFAULTS provide the correct fallback values.
const raw: Partial<ClientEnv> = window._env ?? {};
const decoded = Object.fromEntries(
  Object.entries(raw).filter(([, v]) => v !== "")
) as Partial<ClientEnv>;

export const ENV: ClientEnv = { ...CLIENT_ENV_DEFAULTS, ...decoded };

window.ENV = ENV;
