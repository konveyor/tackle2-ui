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
      syntax: ["node 22"], // browserslist query for node version
      bundle: true,
      autoExternal: false,

      output: {
        target: "node",
        distPath: "./dist",
        sourceMap: {
          js: "source-map",
        },
      },
    },
  ],

  plugins: [
    isWatch &&
      pluginRunNode({
        entryPath: "./dist/index.js",
        execArgv: ["--enable-source-maps"],
      }),
  ],
});
