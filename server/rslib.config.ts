import { defineConfig } from "@rslib/core";

import { pluginRunNode } from "./rslib-plugin-run";

const isDev = process.env.NODE_ENV === "development";
const isWatch =
  isDev && (process.argv.includes("--watch") || process.argv.includes("-w"));

export default defineConfig({
  source: {
    entry: {
      index: "./src/index.js",
    },
  },
  lib: [
    {
      format: "esm",
      output: {
        distPath: "./dist",
        filename: {
          js: "index.js",
        },
        sourceMap: {
          js: isDev ? "cheap-module-source-map" : "source-map",
        },
      },
    },
  ],
  output: {
    target: "node",
    externals: [/^@konveyor-ui\//],
  },
  plugins: [
    isWatch &&
      pluginRunNode({
        entryPath: "./dist/index.js",
        execArgv: ["--enable-source-maps"],
      }),
  ],
});
