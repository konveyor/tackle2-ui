import Keycloak, { KeycloakConfig } from "keycloak-js";

// Setup Keycloak instance as needed
// Pass initialization options as required or leave blank to load from 'keycloak.json'
// const keycloak = Keycloak(process.env.PUBLIC_URL + "/keycloak.json");

const config: KeycloakConfig = {
  url: "/auth",
  realm: process.env.KEYCLOAK_REALM || "tackle",
  clientId: process.env.KEYCLOAK_CLIENT_ID || "tackle-ui",
};

const keycloak = Keycloak(config);
export default keycloak;
