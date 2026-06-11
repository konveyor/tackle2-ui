import type { ClientEnv } from "@konveyor-ui/common";

const CLIENT_ENV_DEFAULTS: ClientEnv = {
  NODE_ENV: "production",
  VERSION: "99.0.0",
  MOCK: "off",
  DEVTOOLS: "off",
  UI_INGRESS_PROXY_BODY_SIZE: "500m",
  RWX_SUPPORTED: "true",
  AUTH_REQUIRED: "false",
  OIDC_CLIENT_ID: "web-ui",
};

const decoded: Partial<ClientEnv> = window._env
  ? (JSON.parse(atob(window._env)) as Partial<ClientEnv>)
  : {};

export const ENV: ClientEnv = { ...CLIENT_ENV_DEFAULTS, ...decoded };
