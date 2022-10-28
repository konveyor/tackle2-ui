/* eslint-disable @typescript-eslint/no-var-requires */

// NOTE: If you define another ENV_VAR here, you must also update the
// ENV_VAR_DEFAULTS array in 'env.ts'
const TACKLE_ENV = [
  "NODE_ENV",
  "AUTH_REQUIRED",
  "KEYCLOAK_REALM",
  "KEYCLOAK_CLIENT_ID",
  "KEYCLOAK_SERVER_URL",
  "UI_INGRESS_PROXY_BODY_SIZE",
  "PROFILE",
  "VERSION",
];

const getEnv = (vars = TACKLE_ENV) =>
  vars.reduce(
    (newObj, varName) => ({ ...newObj, [varName]: process.env[varName] }),
    {}
  );

const getEncodedEnv = () =>
  Buffer.from(JSON.stringify(getEnv())).toString("base64");

module.exports = {
  getEnv,
  getEncodedEnv,
};
