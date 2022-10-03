const path = require("path");
const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");
const { stylePaths } = require("./stylePaths");

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
