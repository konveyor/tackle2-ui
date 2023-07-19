import path from "path";
import { mergeWithRules } from "webpack-merge";
import HtmlWebpackPlugin from "html-webpack-plugin";
import ReactRefreshTypeScript from "react-refresh-typescript";
import ReactRefreshWebpackPlugin from "@pmmmwh/react-refresh-webpack-plugin";
import ForkTsCheckerWebpackPlugin from "fork-ts-checker-webpack-plugin";

import "webpack-dev-server";
import { getEncodedEnv } from "./envLookup";
import { stylePaths } from "./stylePaths";
import commonWebpackConfiguration from "./webpack.common";

const brandType = process.env["PROFILE"] || "konveyor";
const pathTo = (relativePath: string) => path.resolve(__dirname, relativePath);

const config = mergeWithRules({
  module: {
    rules: {
      test: "match",
      use: {
        loader: "match",
        options: "replace",
      },
    },
  },
})(commonWebpackConfiguration, {
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
    hot: true,
  },

  module: {
    rules: [
      {
        test: /\.[jt]sx?$/,
        exclude: /node_modules/,
        use: {
          loader: "ts-loader",
          options: {
            transpileOnly: true, // HMR in webpack-dev-server requires transpileOnly
            getCustomTransformers: () => ({
              before: [ReactRefreshTypeScript()],
            }),
          },
        },
      },
      {
        test: /\.css$/,
        include: [...stylePaths],
        use: ["style-loader", "css-loader"],
      },
    ],
  },

  plugins: [
    new ReactRefreshWebpackPlugin(),
    new ForkTsCheckerWebpackPlugin({
      typescript: {
        mode: "readonly",
      },
    }),
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

  watchOptions: {
    ignored: /node_modules/, // adjust this pattern if using monorepo linked packages
  },
});
export default config;
