import { useQuery } from "react-query";
import keycloak from "@app/keycloak";

export const CookieQueryKey = "cookies";

export const useFetchCookie = (token) => {
  const deleteCookie = (name: string) => {
    document.cookie = `${name} =; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
  };

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

  useQuery(
    [CookieQueryKey, token],
    () => {
      if (token) {
        deleteCookie("proxyToken");
        let token = getCookie("proxyToken");
        if (token !== "" && token !== null) {
        } else {
          token = keycloak?.token || "";

          if (token != "" && token != null) {
            setCookie("proxyToken", token, 365);
          }
        }
      }
    },
    {
      enabled: !!keycloak.token,
      refetchInterval: 5000,
      refetchIntervalInBackground: true,
      refetchOnWindowFocus: false,
    }
  );
};
