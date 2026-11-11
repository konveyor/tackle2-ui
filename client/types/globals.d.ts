import type { ClientEnv } from "@env/types";

export {};

declare global {
  interface Window {
    /**
     * Client environment configuration object injected at runtime.
     *
     * Production: Caddy's `templates` directive processes index.html on each
     * request and embeds the _env value from the `/.env` endpoint.
     *
     * Development: ClientEnvInjectPlugin bakes in the same values that the
     * rspack development server serves at /.env.
     *
     * Consumers should use the `ENV` export from `client/src/app/env.ts` rather
     * than reading `window._env` directly — that module applies shared defaults.
     */
    _env: Partial<ClientEnv> | undefined;

    /** _env as initialized by the application */
    ENV: ClientEnv | undefined;
  }
}
