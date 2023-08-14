/** Define process.env to contain `KonveyorEnvType` */
declare global {
  namespace NodeJS {
    interface ProcessEnv extends Partial<Readonly<KonveyorEnvType>> {}
  }
}

/**
 * The set of environment variables used by `@konveyor-ui` packages.
 */
export type KonveyorEnvType = {
  NODE_ENV: "development" | "production" | "test";
  VERSION: string;

  /** Require keycloak authentication? */
  AUTH_REQUIRED: "true" | "false";
  KEYCLOAK_REALM: string;
  KEYCLOAK_CLIENT_ID: string;
  KEYCLOAK_SERVER_URL: string;

  /** Branding to apply to the UI */
  PROFILE: "konveyor" | "mta";

  /** Upload file size limit */
  UI_INGRESS_PROXY_BODY_SIZE: string;

  /** Allow clearing local maven artifact repository? Requires availability of RWX volumes for hub. */
  RWX_SUPPORTED: "true" | "false";
};

/**
 * Create a `KonveyorEnv` from a partial `KonveyorEnv` with a set of default values.
 */
export const buildKonveyorEnv = ({
  NODE_ENV = "development",
  VERSION = "99.0.0",

  AUTH_REQUIRED = "false",
  KEYCLOAK_REALM = "tackle",
  KEYCLOAK_CLIENT_ID = "tackle-ui",
  KEYCLOAK_SERVER_URL = "",

  PROFILE = "konveyor",
  UI_INGRESS_PROXY_BODY_SIZE = "500m",
  RWX_SUPPORTED = "true",
}: Partial<KonveyorEnvType> = {}): KonveyorEnvType => ({
  NODE_ENV,
  VERSION,

  AUTH_REQUIRED,
  KEYCLOAK_REALM,
  KEYCLOAK_CLIENT_ID,
  KEYCLOAK_SERVER_URL,

  PROFILE,
  UI_INGRESS_PROXY_BODY_SIZE,
  RWX_SUPPORTED,
});

/**
 * Default values for `KonveyorEnvType`.
 */
export const KONVEYOR_ENV_DEFAULTS = buildKonveyorEnv();

/**
 * Current `@konveyor-ui` environment configurations from `process.env`.
 */
export const KONVEYOR_ENV = buildKonveyorEnv(process.env);
