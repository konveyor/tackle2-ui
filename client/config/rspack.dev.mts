import path from "path";

import { rspack } from "@rspack/core";
import type { Configuration } from "@rspack/core";
import type { Configuration as DevServerConfiguration } from "@rspack/dev-server";
import { ReactRefreshRspackPlugin } from "@rspack/plugin-react-refresh";
import HtmlWebpackPlugin from "html-webpack-plugin";
import { mergeWithRules } from "rspack-merge";
import { TsCheckerRspackPlugin } from "ts-checker-rspack-plugin";

import {
  KONVEYOR_ENV,
  SERVER_ENV_KEYS,
  brandingAssetPath,
  brandingStrings,
  encodeEnv,
} from "@konveyor-ui/common";

import commonRspackConfiguration from "./rspack.common.mjs";
import { stylePaths } from "./stylePaths";

const pathTo = (relativePath: string) => path.resolve(__dirname, relativePath);
const faviconPath = path.resolve(brandingAssetPath(), "favicon.ico");

interface RspackDevConfiguration extends Configuration {
  devServer?: DevServerConfiguration;
}

const config: RspackDevConfiguration = mergeWithRules({
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
    port: 9003,
    historyApiFallback: {
      disableDotRule: true,
    },
    hot: true,
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
      {
        test: /\.css$/,
        include: [...stylePaths],
        use: ["style-loader", "css-loader"],
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
        _env: encodeEnv(KONVEYOR_ENV, SERVER_ENV_KEYS),
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
} as RspackDevConfiguration);

export default config;
