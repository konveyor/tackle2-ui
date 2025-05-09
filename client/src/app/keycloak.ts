import Keycloak, { KeycloakConfig } from "keycloak-js";
import { ENV } from "./env";

const config: KeycloakConfig = {
  url: "/auth",
  realm: ENV.KEYCLOAK_REALM || "tackle",
  clientId: ENV.KEYCLOAK_CLIENT_ID || "tackle-ui",
};

const keycloak = new Keycloak(config);
export default keycloak;
