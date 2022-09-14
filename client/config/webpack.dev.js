const path = require("path");
const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");
const { stylePaths } = require("./stylePaths");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const helpers = require("../../server/helpers");

module.exports = merge(common("development"), {
  mode: "development",
  devtool: "eval-source-map",
  watch: true,
  watchOptions: {
    ignored: ["../node_modules"],
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
