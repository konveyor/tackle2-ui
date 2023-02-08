import path from "path";
import merge from "webpack-merge";
import commonWebpackConfiguration from "./webpack.common";
import { stylePaths } from "./stylePaths";
import HtmlWebpackPlugin from "html-webpack-plugin";
import helpers from "../../server/helpers";
import { Configuration } from "webpack";
import "webpack-dev-server";
const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");

const brandType = process.env["PROFILE"] || "konveyor";

const config = merge<Configuration>(commonWebpackConfiguration, {
  mode: "development",
  devtool: "eval-source-map",
  devServer: {
    port: 9000,
    proxy: {
      // NOTE: Any future non-UI paths handled by ../../server/index.js should be added here.
      "/auth": "http://localhost:8080",
      "/hub": "http://localhost:8080",
    },
    historyApiFallback: true,
  },
  optimization: {
    runtimeChunk: "single",
  },
  plugins: [
    new HtmlWebpackPlugin({
      // In dev mode, populate window._env at build time
      filename: "index.html",
      template: path.resolve(__dirname, "../public/index.html.ejs"),
      favicon: path.resolve(__dirname, `../public/${brandType}-favicon.ico`),
      templateParameters: {
        _env: helpers.getEncodedEnv(),
        brandType,
      },
    }),
  ],

  module: {
    rules: [
      {
        test: /\.css$/,
        include: [...stylePaths],
        use: ["style-loader", "css-loader"],
      },
    ],
  },
});
export default config;
