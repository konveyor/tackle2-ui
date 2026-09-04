import type { ClientEnv } from "@konveyor-ui/common";

export {};

declare global {
  interface Window {
    /**
     * Client environment configuration object injected at runtime.
     *
     * Production: Caddy's `templates` directive processes index.html on each
     * request and embeds the _env value from the `/.env` endpoint.
     *
     * Development: HtmlWebpackPlugin bakes the values in at compile time via
     * the Go-template substitution in rspack.common.mts.
     *
     * Consumers should use the `ENV` export from `client/src/app/env.ts` rather
     * than reading `window._env` directly — that module applies defaults and
     * filters out empty strings left by unset env vars.
     */
    _env: Partial<ClientEnv> | undefined;

    /** _env as initialized by the application */
    ENV: ClientEnv | undefined;
  }
}
