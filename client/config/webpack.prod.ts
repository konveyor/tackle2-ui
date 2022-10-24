import path from "path";
import merge from "webpack-merge";
import webpack, { Configuration } from "webpack";
import commonWebpackConfiguration from "./webpack.common";
import { stylePaths } from "./stylePaths";
import HtmlWebpackPlugin from "html-webpack-plugin";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import CssMinimizerPlugin from "css-minimizer-webpack-plugin";
import TerserJSPlugin from "terser-webpack-plugin";

const brandType = process.env["PROFILE"] || "konveyor";

const config = merge<Configuration>(commonWebpackConfiguration, {
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

export default config;
