import path from "path";
import merge from "webpack-merge";
import { Configuration } from "webpack";
import HtmlWebpackPlugin from "html-webpack-plugin";
import "webpack-dev-server";

import { getEncodedEnv } from "./envLookup";
import { stylePaths } from "./stylePaths";
import commonWebpackConfiguration from "./webpack.common";

const brandType = process.env["PROFILE"] || "konveyor";
const pathTo = (relativePath: string) => path.resolve(__dirname, relativePath);

const config = merge<Configuration>(commonWebpackConfiguration, {
  mode: "development",
  devtool: "eval-source-map",
  output: {
    filename: "[name].js",
    chunkFilename: "js/[name].js",
    assetModuleFilename: "assets/[name][ext]",
  },

  devServer: {
    port: 9000,
    proxy: {
      // NOTE: Any future non-UI paths handled by the server package should be added here.
      "/auth": "http://localhost:8080",
      "/hub": "http://localhost:8080",
    },
    historyApiFallback: {
      disableDotRule: true,
    },
  },

  plugins: [
    new HtmlWebpackPlugin({
      // In dev mode, populate window._env at build time
      filename: "index.html",
      template: pathTo("../public/index.html.ejs"),
      favicon: pathTo(`../public/${brandType}-favicon.ico`),
      templateParameters: {
        _env: getEncodedEnv(),
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
