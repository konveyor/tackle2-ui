/**
 * The set of environment variables used by tackle2-ui plus "NODE_ENV".  This list
 * needs to be kept in sync with `client/src/app/env.ts`.
 */
const TACKLE_ENV = [
  "NODE_ENV",
  "AUTH_REQUIRED",
  "KEYCLOAK_REALM",
  "KEYCLOAK_CLIENT_ID",
  "KEYCLOAK_SERVER_URL",
  "UI_INGRESS_PROXY_BODY_SIZE",
  "PROFILE",
  "VERSION",
  "RWX_SUPPORTED",
];

/**
 * Return an object containing the environment variables listed in `TACKLE_ENV` and
 * their values.
 */
const getEnv = (vars = TACKLE_ENV) =>
  Object.fromEntries(vars.map((key) => [key, process.env[key]]));

/**
 * Return a base64 encoded JSON string containing the environment variables listed in
 * `TACKLE_ENV` and their values.
 */
export const getEncodedEnv = () =>
  Buffer.from(JSON.stringify(getEnv())).toString("base64");
