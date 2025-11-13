import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import run from "@rollup/plugin-run";

const buildAndRun = process.env?.ROLLUP_RUN === "true";

/** @type {import('rollup').RollupOptions} */
export default {
  strictDeprecations: true,

  input: "src/index.js",
  output: {
    file: "dist/index.js",
    format: "esm",
    sourcemap: true,
  },
  watch: {
    clearScreen: false,
  },

  plugins: [
    nodeResolve({
      preferBuiltins: true,
    }),
    commonjs(),
    json(),
    buildAndRun &&
      run({
        execArgv: ["-r", "source-map-support/register"],
      }),
  ],
};
