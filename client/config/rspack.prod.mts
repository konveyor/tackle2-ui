import { rspack } from "@rspack/core";
import type { Configuration } from "@rspack/core";
import { merge } from "rspack-merge";

import commonRspackConfiguration from "./rspack.common.mjs";

const config = merge(commonRspackConfiguration, {
  mode: "production",
  devtool: "nosources-source-map",
  output: {
    filename: "[name].[contenthash:8].min.js",
    chunkFilename: "js/[name].[chunkhash:8].min.js",
    assetModuleFilename: "assets/[name].[contenthash:8][ext]",
    cssFilename: "[name].[contenthash:8].css",
    cssChunkFilename: "css/[name].[chunkhash:8].min.css",
  },

  optimization: {
    minimize: true,
    minimizer: [
      new rspack.SwcJsMinimizerRspackPlugin(),
      new rspack.LightningCssMinimizerRspackPlugin(),
    ],
  },

  plugins: [
    new rspack.EnvironmentPlugin({
      NODE_ENV: "production",
    }),
  ],
} as Configuration);

export default config;
