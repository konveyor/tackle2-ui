const path = require("path");
const { merge } = require("webpack-merge");
const webpack = require("webpack");
const common = require("./webpack.common.js");
const { stylePaths } = require("./stylePaths");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const TerserJSPlugin = require("terser-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const brandType = process.env["PROFILE"] || "konveyor";

module.exports = merge(common("production"), {
  mode: "production",
  devtool: "nosources-source-map",
  optimization: {
    minimizer: [new TerserJSPlugin({}), `...`, new CssMinimizerPlugin()],
    sideEffects: true,
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "[name].css",
      chunkFilename: "[name].bundle.css",
    }),
    new CssMinimizerPlugin({
      minimizerOptions: {
        preset: ["default", { mergeLonghand: false }],
      },
    }),
    new HtmlWebpackPlugin({
      // In real prod mode, populate window._env at run time with express
      filename: "index.html.ejs",
      template: `!!raw-loader!${path.resolve(
        __dirname,
        "../public/index.html.ejs"
      )}`,
      favicon: path.resolve(__dirname, `../public/${brandType}-favicon.ico`),
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
