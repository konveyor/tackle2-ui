import { initInterceptors } from "@app/axios-config";
import { isAuthRequired } from "@app/Constants";
import i18n from "@app/i18n";
import keycloak from "@app/keycloak";
import { AppPlaceholder } from "@app/shared/components";
import { Flex, FlexItem, Spinner } from "@patternfly/react-core";
import { ReactKeycloakProvider } from "@react-keycloak/web";
import React, { Suspense, useEffect } from "react";

interface IKeycloakProviderProps {
  children: React.ReactNode;
}

export const KeycloakProvider: React.FunctionComponent<
  IKeycloakProviderProps
> = ({ children }) => {
  if (isAuthRequired) {
    return (
      <>
        <ReactKeycloakProvider
          authClient={keycloak}
          initOptions={{ onLoad: "login-required" }}
          LoadingComponent={
            <Flex
              spaceItems={{ default: "spaceItemsSm" }}
              alignItems={{ default: "alignItemsCenter" }}
              flexWrap={{ default: "nowrap" }}
              style={{
                width: "100%",
                height: "100%",
              }}
            >
              <FlexItem
                style={{
                  margin: "auto auto",
                  textAlign: "center",
                }}
              >
                <Spinner>Loading...</Spinner>
              </FlexItem>
            </Flex>
          }
          isLoadingCheck={(keycloak) => {
            if (keycloak.authenticated) {
              initInterceptors(() => {
                return new Promise<string>((resolve, reject) => {
                  if (keycloak.token) {
                    keycloak
                      .updateToken(5)
                      .then(() => {
                        return resolve(keycloak.token!);
                      })
                      .catch((err) => {
                        console.log("err", err);
                        return reject("Failed to refresh token");
                      });
                  } else {
                    keycloak.login();
                    reject("Not logged in");
                  }
                });
              });

              const kcLocale = (keycloak.tokenParsed as any)["locale"];
              if (kcLocale) {
                i18n.changeLanguage(kcLocale);
              }
            }

            return !keycloak.authenticated;
          }}
        >
          {children}
        </ReactKeycloakProvider>
      </>
    );
  } else {
    return (
      <>
        <Suspense fallback={<AppPlaceholder />}>{children}</Suspense>
      </>
    );
  }
};
