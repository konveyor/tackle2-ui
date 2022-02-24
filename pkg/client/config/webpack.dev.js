const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");
const { stylePaths } = require("./stylePaths");

module.exports = merge(common("development"), {
  mode: "development",
  devtool: "eval-source-map",
  watch: true,
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
