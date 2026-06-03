import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import util from "node:util";

import { defineConfig } from "@rslib/core";
import { rspack } from "@rspack/core";
import { render } from "ejs";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const pathTo = (...relativePath) => path.resolve(__dirname, ...relativePath);

const baseBrandingPath = process.env.BRANDING ?? "./branding";
const brandingPath = pathTo("../", baseBrandingPath);
const jsonStrings = JSON.parse(
  readFileSync(path.resolve(brandingPath, "./strings.json"), "utf8")
);
const stringsModule = render(
  `
  export const strings = ${util.inspect(jsonStrings)};
  export default strings;
`,
  {
    brandingRoot: "branding",
  }
);

console.log("Using branding assets from:", brandingPath);

export default defineConfig({
  source: {
    entry: {
      index: "./src/index.ts",
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
  ],
  output: {
    target: "node",
    copy: [{ from: `${brandingPath}/*`, to: "branding" }],
  },
  tools: {
    rspack: {
      plugins: [
        new rspack.experiments.VirtualModulesPlugin({
          "@konveyor-ui/branding/strings.js": stringsModule,
        }),
      ],
    },
  },
});
