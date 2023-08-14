export * from "./environment.js";
export * from "./proxies.js";

/**
 * Return a base64 encoded JSON string containing the given `env` object.
 */
export const encodeEnv = (env: object): string => btoa(JSON.stringify(env));

/**
 * Return an objects from a base64 encoded JSON string.
 */
export const decodeEnv = (env: string): object =>
  !env ? undefined : JSON.parse(atob(env));

// TODO: Include `index.html.ejs` to `index.html` template file processing...
