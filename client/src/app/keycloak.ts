import Keycloak, { KeycloakConfig } from "keycloak-js";
import { ENV } from "./Constants";

// Setup Keycloak instance as needed
// Pass initialization options as required or leave blank to load from 'keycloak.json'
// const keycloak = Keycloak(process.env.PUBLIC_URL + "/keycloak.json");

const config: KeycloakConfig = {
  url: "/auth",
  realm: ENV.KEYCLOAK_REALM || "tackle",
  clientId: ENV.KEYCLOAK_CLIENT_ID || "tackle-ui",
};

const keycloak = Keycloak(config);
export default keycloak;
