const ENV_VAR_KEYS = [
  "AUTH_REQUIRED",
  "KEYCLOAK_REALM",
  "KEYCLOAK_CLIENT_ID",
  "KEYCLOAK_SERVER_URL",
  "UI_INGRESS_PROXY_BODY_SIZE",
  "PROFILE",
] as const;

export type EnvVars = Record<typeof ENV_VAR_KEYS[number], string>;

const ENV_DEFAULTS: EnvVars = {
  AUTH_REQUIRED: "true",
  KEYCLOAK_REALM: "",
  KEYCLOAK_CLIENT_ID: "",
  KEYCLOAK_SERVER_URL: "",
  UI_INGRESS_PROXY_BODY_SIZE: "",
  PROFILE: "konveyor",
};

declare global {
  interface Window {
    _env: EnvVars;
  }
}
export const ENV: EnvVars = window._env || {};

ENV_VAR_KEYS.forEach((key) => {
  if (!ENV[key]) ENV[key] = ENV_DEFAULTS[key];
});
