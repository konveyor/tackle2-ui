/**
 * The set of environment variables passed from the server to the client SPA
 * via `window._env`. This interface is the contract between server serialization
 * and client deserialization -- keep it in sync with both sides.
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

  /** OIDC client ID for the UI */
  OIDC_CLIENT_ID: string;
};

/**
 * Server-side configuration read from `process.env`. These values are used by
 * the server itself (proxy targets, port, etc.) and are NOT sent to the client.
 */
export type ServerConfig = {
  NODE_ENV: "development" | "production" | "test";
  DEBUG: boolean;

  /** The listen port for the UI's server */
  PORT: string;

  /** Location of branding files (relative paths computed from the project source root) */
  BRANDING?: string;

  /** Target URL for the UI server's `/hub` proxy */
  TACKLE_HUB_URL?: string;

  /** Target URL for the UI server's `/llm-proxy` proxy */
  KAI_LLM_PROXY_URL?: string;

  /**
   * Target URL for the legacy Keycloak instance in an upgraded operator, used for `/auth` proxy
   * @deprecated This is only used for upgrading an operator to allow access to the existing legacy Keycloak instance.
   * */
  KEYCLOAK_SERVER_URL?: string;
};
