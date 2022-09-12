type CookieNames = "keycloak_cookie";

export const deleteCookie = (name: CookieNames) => {
  document.cookie = `${name} =; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
};

export const setCookie = (
  name: CookieNames,
  value: string,
  expDays: number
) => {
  let date = new Date();
  date.setTime(date.getTime() + expDays * 24 * 60 * 60 * 1000);
  const expires = "expires=" + date.toUTCString();
  document.cookie = `${name} = ${value}; ${expires}; path=/`;
};

export const getCookie = (name: CookieNames) => {
  let cookieArr = document.cookie.split(";");
  for (let i = 0; i < cookieArr.length; i++) {
    let cookiePair = cookieArr[i].split("=");
    if (name === cookiePair[0].trim()) {
      return decodeURIComponent(cookiePair[1]);
    }
  }
  return null;
};
