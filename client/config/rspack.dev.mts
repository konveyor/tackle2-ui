import { fileURLToPath } from "node:url";
import path from "path";

import { type RspackOptions, rspack } from "@rspack/core";
import type { Configuration as DevServerConfiguration } from "@rspack/dev-server";
import { ReactRefreshRspackPlugin } from "@rspack/plugin-react-refresh";
import { mergeWithRules } from "rspack-merge";
import { TsCheckerRspackPlugin } from "ts-checker-rspack-plugin";

import ClientEnvInjectPlugin from "./ClientEnvInjectPlugin";
import commonRspackConfiguration from "./rspack.common.mjs";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const pathTo = (relativePath: string) => path.resolve(__dirname, relativePath);

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
    new ClientEnvInjectPlugin(),
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
  ],

  watchOptions: {
    // ignore watching everything except @konveyor-ui packages
    ignored: /node_modules\/(?!@konveyor-ui\/)/,
  },
} as Configuration);

export default config;
