import { fileURLToPath } from "node:url";
import path from "path";

import { type RspackOptions, rspack } from "@rspack/core";
import type { Configuration as DevServerConfiguration } from "@rspack/dev-server";
import { ReactRefreshRspackPlugin } from "@rspack/plugin-react-refresh";
import HtmlWebpackPlugin from "html-webpack-plugin";
import { mergeWithRules } from "rspack-merge";
import { TsCheckerRspackPlugin } from "ts-checker-rspack-plugin";

import { type ClientEnv, brandingStrings } from "@konveyor-ui/common";

import commonRspackConfiguration, { brandingPath } from "./rspack.common.mjs";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const pathTo = (relativePath: string) => path.resolve(__dirname, relativePath);
const faviconPath = path.resolve(brandingPath, "favicon.ico");

/** Build the client env blob from the current process.env for dev-mode HTML injection. */
const devClientEnv = (env: ClientEnv = process.env as unknown as ClientEnv) =>
  btoa(
    JSON.stringify({
      NODE_ENV: env.NODE_ENV ?? "development",
      VERSION: env.VERSION ?? "99.0.0",
      MOCK: env.MOCK ?? "off",
      DEVTOOLS: env.DEVTOOLS ?? "off",
      UI_INGRESS_PROXY_BODY_SIZE: env.UI_INGRESS_PROXY_BODY_SIZE ?? "500m",
      RWX_SUPPORTED: env.RWX_SUPPORTED ?? "true",
      AUTH_REQUIRED: env.AUTH_REQUIRED ?? "false",
      // On by default in dev — the standalone dev server has no proxy config
      // to derive from, and dev is where the console is being built.
      AGENTIC_ENABLED: env.AGENTIC_ENABLED ?? "true",
      OIDC_CLIENT_ID: env.OIDC_CLIENT_ID ?? "web-ui",
    } as ClientEnv)
  );

interface Configuration extends RspackOptions {
  devServer?: DevServerConfiguration;
}

const config: Configuration = mergeWithRules({
  module: {
    rules: {
      test: "match",
      use: {
        loader: "match",
        options: "replace",
      },
    },
  },
})(commonRspackConfiguration, {
  mode: "development",
  devtool: "eval-source-map",
  output: {
    filename: "[name].js",
    chunkFilename: "js/[name].js",
    assetModuleFilename: "assets/[name][ext]",
  },

  devServer: {
    port: 9001,
    historyApiFallback: {
      disableDotRule: true,
    },
    hot: true,
  },
  lazyCompilation: false,

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
              transform: {
                react: {
                  runtime: "automatic",
                  development: true,
                  refresh: true,
                },
              },
            },
            detectSyntax: "auto",
          },
        },
        type: "javascript/auto",
      },
    ],
  },

  plugins: [
    new ReactRefreshRspackPlugin(),
    new TsCheckerRspackPlugin({
      typescript: {
        mode: "readonly",
      },
    }),
    new rspack.CopyRspackPlugin({
      patterns: [
        {
          from: pathTo("../public/mockServiceWorker.js"),
        },
      ],
    }),

    // index.html generated at compile time to inject `_env`
    new HtmlWebpackPlugin({
      filename: "index.html",
      template: pathTo("../public/index.html.ejs"),
      templateParameters: {
        _env: devClientEnv(),
        branding: brandingStrings,
      },
      favicon: faviconPath,
      minify: {
        collapseWhitespace: false,
        keepClosingSlash: true,
        minifyJS: true,
        removeEmptyAttributes: true,
        removeRedundantAttributes: true,
      },
    }),
  ],

  watchOptions: {
    // ignore watching everything except @konveyor-ui packages
    ignored: /node_modules\/(?!@konveyor-ui\/)/,
  },
} as Configuration);

export default config;
