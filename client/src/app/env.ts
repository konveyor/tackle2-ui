import { buildClientEnv } from "@env/types";

// Production Caddy and the development HTML plugin inject the same plain-object
// contract served by /.env. Apply the shared defaults for missing/empty values.
export const ENV = buildClientEnv(window._env);

window.ENV = ENV;
