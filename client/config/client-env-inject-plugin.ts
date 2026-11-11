import { rspack } from "@rspack/core";
import type { Compiler, RspackPluginInstance } from "@rspack/core";

// Build configuration cannot use the client's tsconfig path aliases.
import { type ClientEnv, serializeClientEnv } from "../src/env/types";

/** Development equivalent of Caddy's runtime JSON inclusion. */
export default class ClientEnvInjectPlugin implements RspackPluginInstance {
  constructor(private readonly clientEnv: ClientEnv) {}

  apply(compiler: Compiler) {
    const serialized = serializeClientEnv(this.clientEnv);
    compiler.hooks.compilation.tap("ClientEnvInjectPlugin", (compilation) => {
      const hooks = rspack.HtmlRspackPlugin.getCompilationHooks(compilation);
      hooks.afterTemplateExecution.tap("ClientEnvInjectPlugin", (data) => {
        data.html = data.html.replace(
          '{{httpInclude "/.env"}}',
          () => serialized
        );
        return data;
      });
    });
  }
}
