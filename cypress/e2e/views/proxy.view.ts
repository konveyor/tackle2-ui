export const excludedList = "#excluded";
export enum ProxyType {
  http = "http",
  https = "https",
}

export const ProxyViewSelectorsByType = {
  [ProxyType.http]: {
    host: '[name="httpHost"]',
    port: '[name="httpPort"]',
    enabledSwitch: "#httpProxy",
    identityRequired: "#http-identity-required",
    credentialsSelectToggle:
      "button[aria-label='HTTP proxy credentials select dropdown toggle']",
    hostHelper: "#httpHost-helper",
  },
  [ProxyType.https]: {
    host: '[name="httpsHost"]',
    port: '[name="httpsPort"]',
    enabledSwitch: "#httpsProxy",
    identityRequired: "#https-identity-required",
    credentialsSelectToggle:
      "button[aria-label='HTTPS proxy credentials select dropdown toggle']",
    hostHelper: "#httpsHost-helper",
  },
};

export const navLink = "a.pf-v6-c-nav__link";
export const port = "#port";
export const helper = "span.pf-v6-c-helper-text__item-text";
