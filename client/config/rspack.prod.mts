import fs from "fs";
import path from "path";

import { rspack } from "@rspack/core";
import type { Configuration } from "@rspack/core";
import HtmlWebpackPlugin from "html-webpack-plugin";
import { merge } from "rspack-merge";

import { brandingAssetPath } from "@konveyor-ui/common";

import commonRspackConfiguration from "./rspack.common.mjs";
import { stylePaths } from "./stylePaths";

const pathTo = (relativePath: string) => path.resolve(__dirname, relativePath);
const faviconPath = path.resolve(brandingAssetPath(), "favicon.ico");

const config = merge(commonRspackConfiguration, {
  mode: "production",
  devtool: "nosources-source-map",
  output: {
    filename: "[name].[contenthash:8].min.js",
    chunkFilename: "js/[name].[chunkhash:8].min.js",
    assetModuleFilename: "assets/[name].[contenthash:8][ext]",
  },

  optimization: {
    minimize: true,
    minimizer: [
      new rspack.SwcJsMinimizerRspackPlugin(),
      new rspack.LightningCssMinimizerRspackPlugin(),
    ],
  },

  module: {
    rules: [
      {
        test: /\.css$/,
        include: [...stylePaths],
        use: [rspack.CssExtractRspackPlugin.loader, "css-loader"],
      },
    ],
  },

  plugins: [
    new rspack.CssExtractRspackPlugin({
      filename: "[name].[contenthash:8].css",
      chunkFilename: "css/[name].[chunkhash:8].min.css",
    }),
    new rspack.EnvironmentPlugin({
      NODE_ENV: "production",
    }),

    // index.html.ejs is served at runtime by Express which injects `_env`
    new HtmlWebpackPlugin({
      filename: "index.html.ejs",
      templateContent: fs.readFileSync(
        pathTo("../public/index.html.ejs"),
        "utf-8"
      ),
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
} as Configuration);

export default config;
