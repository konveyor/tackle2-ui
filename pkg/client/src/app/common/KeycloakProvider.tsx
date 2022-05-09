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
  const setCookie = (cName: string, cValue: string, expDays: number) => {
    let date = new Date();
    date.setTime(date.getTime() + expDays * 24 * 60 * 60 * 1000);
    const expires = "expires=" + date.toUTCString();
    document.cookie = `${cName} = ${cValue}; ${expires}; path=/`;
  };

  const getCookie = (token: string) => {
    let cookieArr = document.cookie.split(";");
    for (let i = 0; i < cookieArr.length; i++) {
      let cookiePair = cookieArr[i].split("=");
      if (token == cookiePair[0].trim()) {
        return decodeURIComponent(cookiePair[1]);
      }
    }
    return null;
  };

  const checkCookie = () => {
    deleteCookie("proxyToken");
    let token = getCookie("proxyToken");
    if (token !== "" && token !== null) {
    } else {
      token = keycloak?.token || "";

      if (token != "" && token != null) {
        setCookie("proxyToken", token, 365);
      }
    }
  };
  const deleteCookie = (name: string) => {
    document.cookie = `${name} =; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
  };
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
                    checkCookie();
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
