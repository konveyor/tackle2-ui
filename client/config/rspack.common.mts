import { createRequire } from "node:module";
import path from "path";

import { rspack } from "@rspack/core";
import type { Configuration } from "@rspack/core";
import MonacoWebpackPlugin from "monaco-editor-webpack-plugin";

import { LANGUAGES_BY_FILE_EXTENSION } from "./monacoConstants";

const pathTo = (relativePath: string) => path.resolve(__dirname, relativePath);
const _require = createRequire(import.meta.url);
export const brandingPath = path.resolve(
  path.dirname(_require.resolve("@konveyor-ui/common/package.json")),
  "dist/branding"
);
const manifestPath = path.resolve(brandingPath, "manifest.json");

const config: Configuration = {
  entry: {
    app: [pathTo("../src/index.tsx")],
  },

  output: {
    path: pathTo("../dist"),
    publicPath: "auto",
    clean: true,
  },

  module: {
    rules: [
      {
        test: /\.[jt]sx?$/,
        exclude: /node_modules/,
        use: {
          loader: "builtin:swc-loader",
          options: {
            jsc: {
              parser: { syntax: "typescript", tsx: true },
              transform: { react: { runtime: "automatic" } },
            },
            detectSyntax: "auto",
          },
        },
        type: "javascript/auto",
      },

      // Fonts (PF + Monaco) -- .woff2 referenced via CSS @font-face url()
      { test: /\.(woff2?|ttf|eot)$/, type: "asset/resource" },

      // App-local SVGs imported as raw strings
      { test: /\.svg$/, include: [pathTo("../src")], type: "asset/source" },

      // Images -- inline if small, emit as file if large
      {
        test: /\.(jpg|jpeg|png|gif)$/i,
        type: "asset",
        parser: { dataUrlCondition: { maxSize: 8096 } },
      },

      // Monaco CSS -- always style-loader (separate from PF CSS pipeline)
      {
        test: /\.css$/,
        include: [pathTo("../../node_modules/monaco-editor")],
        use: ["style-loader", "css-loader"],
      },

      // XSD schemas and YAML imported as raw strings
      {
        test: /\.(xsd)$/,
        include: [pathTo("../src")],
        type: "asset/source",
      },
      {
        test: /\.yaml$/,
        type: "asset/source",
      },
    ],
  },

  plugins: [
    new rspack.DefinePlugin({ "process.env": "{}" }),
    new rspack.CopyRspackPlugin({
      patterns: [
        {
          from: pathTo("../public/locales"),
          to: "./locales/",
        },
        {
          from: pathTo("../public/templates"),
          to: "./templates/",
        },
        {
          from: manifestPath,
          to: ".",
        },
        {
          from: brandingPath,
          to: "./branding/",
        },
      ],
    }),
    new MonacoWebpackPlugin({
      filename: "monaco/[name].worker.js",
      languages: Object.values(LANGUAGES_BY_FILE_EXTENSION),
    }),
  ],

  resolve: {
    extensions: [".js", ".ts", ".tsx", ".jsx"],
    tsConfig: {
      configFile: pathTo("../tsconfig.json"),
    },
    symlinks: false,
    fallback: { crypto: false, fs: false, path: false },
  },
};

export default config;
