import path from "path";
import merge from "webpack-merge";
import webpack, { Configuration } from "webpack";
import HtmlWebpackPlugin from "html-webpack-plugin";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import CssMinimizerPlugin from "css-minimizer-webpack-plugin";

import { stylePaths } from "./stylePaths";
import commonWebpackConfiguration from "./webpack.common";

const brandType = process.env["PROFILE"] || "konveyor";
const pathTo = (relativePath: string) => path.resolve(__dirname, relativePath);

const config = merge<Configuration>(commonWebpackConfiguration, {
  mode: "production",
  devtool: "nosources-source-map", // used to map stack traces on the client without exposing all of the source code
  output: {
    filename: "[name].[contenthash:8].min.js",
    chunkFilename: "js/[name].[chunkhash:8].min.js",
    assetModuleFilename: "assets/[name].[contenthash:8][ext]",
  },

  optimization: {
    minimize: true,
    minimizer: [
      "...", // The '...' string represents the webpack default TerserPlugin instance
      new CssMinimizerPlugin(),
    ],
  },

  plugins: [
    new MiniCssExtractPlugin({
      filename: "[name].[contenthash:8].css",
      chunkFilename: "css/[name].[chunkhash:8].min.css",
    }),
    new CssMinimizerPlugin({
      minimizerOptions: {
        preset: ["default", { mergeLonghand: false }],
      },
    }),
    new HtmlWebpackPlugin({
      // In real prod mode, populate window._env at run time with express
      filename: "index.html.ejs",
      template: `!!raw-loader!${pathTo("../public/index.html.ejs")}`,
      favicon: pathTo(`../public/${brandType}-favicon.ico`),
    }),
    new webpack.EnvironmentPlugin({
      NODE_ENV: "production",
    }),
  ],

  module: {
    rules: [
      {
        test: /\.css$/,
        include: [...stylePaths],
        use: [MiniCssExtractPlugin.loader, "css-loader"],
      },
    ],
  },
});

export default config;
