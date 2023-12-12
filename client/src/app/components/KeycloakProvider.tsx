import React, { Suspense } from "react";
import { ReactKeycloakProvider } from "@react-keycloak/web";
import keycloak from "@app/keycloak";
import { AppPlaceholder } from "./AppPlaceholder";
import { initInterceptors } from "@app/axios-config";

interface IKeycloakProviderProps {
  children: React.ReactNode;
}

export const KeycloakProvider: React.FC<IKeycloakProviderProps> = ({
  children,
}) => {
  React.useEffect(() => {
    initInterceptors();
  }, []);

  return (
    <ReactKeycloakProvider
      authClient={keycloak}
      initOptions={{ onLoad: "login-required" }}
      LoadingComponent={<AppPlaceholder />}
    >
      <Suspense fallback={<AppPlaceholder />}>{children}</Suspense>
    </ReactKeycloakProvider>
  );
};
