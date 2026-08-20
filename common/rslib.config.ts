import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig, rspack } from "@rslib/core";
import { render } from "ejs";

import { pluginBuildMarker } from "./rslib-plugin-build-marker";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const baseBrandingPath = process.env.BRANDING ?? "./branding";
const brandingPath = path.resolve(__dirname, "../", baseBrandingPath);
const jsonStrings = JSON.parse(
  readFileSync(path.resolve(brandingPath, "./strings.json"), "utf8")
);
const stringsModule = render(
  `
  export const strings = ${JSON.stringify(jsonStrings)};
  export default strings;
`,
  {
    brandingRoot: "branding",
  }
);

console.log("Using branding assets from:", brandingPath);

// Rspack VirtualModulesPlugin creates in-memory files relative to the compiler
// context (unlike Rollup's virtual plugin, which can register bare module IDs).
// Alias the package-style import used in source to that virtual file path.
const brandingStringsVirtualPath = "src/virtual/branding-strings.js";

export default defineConfig({
  source: {
    entry: {
      index: "./src/index.ts",
    },
  },
  resolve: {
    alias: {
      "@konveyor-ui/branding/strings.js": brandingStringsVirtualPath,
    },
  },
  lib: [
    {
      format: "esm",
      dts: true,
      output: {
        distPath: "./dist",
        filename: {
          js: "index.mjs",
        },
        sourceMap: {
          js: "source-map",
        },
      },
    },
    {
      format: "cjs",
      output: {
        distPath: "./dist",
        filename: {
          js: "index.cjs",
        },
        sourceMap: {
          js: "source-map",
        },
      },
    },
  ],
  output: {
    target: "node",
    copy: [{ from: "**/*", to: "branding", context: brandingPath }],
  },
  tools: {
    rspack: {
      plugins: [
        new rspack.experiments.VirtualModulesPlugin({
          [brandingStringsVirtualPath]: stringsModule,
        }),
      ],
    },
  },
  plugins: [pluginBuildMarker({ markerFilePath: "./dist/.built" })],
});
