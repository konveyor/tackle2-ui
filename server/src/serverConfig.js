/** @import { ClientEnv, ServerConfig } from "@konveyor-ui/common" */

/**
 * Server-side configuration read from `process.env`. These values are used by
 * the server itself (proxy targets, port, etc.) and are NOT sent to the client.
 *
 * @type {ServerConfig}
 */
export const serverConfig = {
  NODE_ENV: process.env.NODE_ENV ?? "production",
  DEBUG: process.env.DEBUG === "1",
  PORT: process.env.PORT,
  BRANDING: process.env.BRANDING,

  TACKLE_HUB_URL: process.env.TACKLE_HUB_URL,
  KAI_LLM_PROXY_URL: process.env.KAI_LLM_PROXY_URL,
};

/**
 * Client-facing configuration derived from `process.env`. This object is
 * serialized to `window._env` in the HTML response and must match `ClientEnv`
 * from `@konveyor-ui/common`.
 *
 * @type {ClientEnv}
 */
export const clientConfig = {
  NODE_ENV: serverConfig.NODE_ENV,
  VERSION: process.env.VERSION ?? "99.0.0",
  MOCK: process.env.MOCK ?? "off",
  DEVTOOLS: process.env.DEVTOOLS ?? "off",
  UI_INGRESS_PROXY_BODY_SIZE: process.env.UI_INGRESS_PROXY_BODY_SIZE ?? "500m",
  RWX_SUPPORTED: process.env.RWX_SUPPORTED ?? "true",
  AUTH_REQUIRED: process.env.AUTH_REQUIRED ?? "false",
  OIDC_CLIENT_ID: process.env.OIDC_CLIENT_ID ?? "web-ui",
};

/**
 * Serialize `clientConfig` as a base64 JSON string for injection into
 * `window._env` in the HTML template.
 *
 * @returns {string}
 */
export const serializeClientConfig = () => btoa(JSON.stringify(clientConfig));
