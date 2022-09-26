const path = require("path");
const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");
const { stylePaths } = require("./stylePaths");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const helpers = require("../../server/helpers");

module.exports = merge(common("development"), {
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
      favicon: path.resolve(__dirname, "../public/favicon.ico"),
      templateParameters: {
        _env: helpers.getEncodedEnv(),
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
