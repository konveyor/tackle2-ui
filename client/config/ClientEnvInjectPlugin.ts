import { rspack } from "@rspack/core";
import type { Compiler, RspackPluginInstance } from "@rspack/core";

// Note: tsconfig.json paths are not available to rspack config files, reference with direct paths.
import { CLIENT_ENV } from "../src/env/types";

type ClientEnvInjectPluginOptions = Record<string, never>; // no options

/**
 * Process the Caddy HTML template to inject the CLIENT_ENV JSON object literal.
 *
 * In production, Caddy's `templates` directive processes the file at request
 * time.  The `{{httpInclude "/.env"}}` expression makes an internal sub-request
 * to the `/.env` endpoint and embeds the resulting JSON object.
 *
 * In development, we do the equivalent at rspack compile time.  Replace the
 * `{{httpInclude "/.env"}}` expression with the CLIENT_ENV JSON object literal.
 */
export default class ClientEnvInjectPlugin implements RspackPluginInstance {
  private readonly options: ClientEnvInjectPluginOptions;
  private readonly name: string = "ClientEnvInjectPlugin";

  constructor(options: ClientEnvInjectPluginOptions = {}) {
    this.options = options;
  }

  apply(compiler: Compiler) {
    compiler.hooks.compilation.tap(this.name, (compilation) => {
      const hooks = rspack.HtmlRspackPlugin.getCompilationHooks(compilation);
      hooks.afterTemplateExecution.tapPromise(this.name, async (data) => {
        data.html = data.html.replace(
          '{{httpInclude "/.env"}}',
          JSON.stringify(CLIENT_ENV)
        );
        return data;
      });
    });
  }
}
