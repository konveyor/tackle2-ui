/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const Dotenv = require("dotenv-webpack");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");
const { WatchIgnorePlugin } = require("webpack");


const BG_IMAGES_DIRNAME = "images";

module.exports = (env) => {
  return {
    entry: {
      app: [
        "react-hot-loader/patch",
        path.resolve(__dirname, "../src/index.tsx"),
      ],
    },
    output: {
      filename: "[name].bundle.js",
      path: path.resolve(__dirname, "../dist"),
      publicPath: "auto",
      clean: true,
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          loader: "ts-loader",
          exclude: /node_modules/,
          options: {
            // disable type checker for fork-ts-checker-webpack-plugin
            transpileOnly: true,
          },
        },
        {
          test: /\.(svg|ttf|eot|woff|woff2)$/,
          // only process modules with this loader
          // if they live under a 'fonts' or 'pficon' directory
          include: [
            path.resolve(
              __dirname,
              "../../../node_modules/patternfly/dist/fonts"
            ),
            path.resolve(
              __dirname,
              "../../../node_modules/@patternfly/react-core/dist/styles/assets/fonts"
            ),
            path.resolve(
              __dirname,
              "../../../node_modules/@patternfly/react-core/dist/styles/assets/pficon"
            ),
            path.resolve(
              __dirname,
              "../../../node_modules/@patternfly/patternfly/assets/fonts"
            ),
            path.resolve(
              __dirname,
              "../../../node_modules/@patternfly/patternfly/assets/pficon"
            ),
          ],
          use: {
            loader: "file-loader",
            options: {
              // Limit at 50k. larger files emited into separate files
              limit: 5000,
              outputPath: "fonts",
              name: "[name].[ext]",
            },
          },
        },
        {
          test: /\.(xsd)$/,
          include: [path.resolve(__dirname, "../src")],
          use: {
            loader: "raw-loader",
            options: {
              esModule: true,
            },
          },
        },
        {
          test: /\.svg$/,
          include: (input) => input.indexOf("background-filter.svg") > 1,
          use: [
            {
              loader: "url-loader",
              options: {
                limit: 5000,
                outputPath: "svgs",
                name: "[name].[ext]",
              },
            },
          ],
          type: "javascript/auto",
        },
        {
          test: /\.svg$/,
          // only process SVG modules with this loader if they live under a 'bgimages' directory
          // this is primarily useful when applying a CSS background using an SVG
          include: (input) => input.indexOf(BG_IMAGES_DIRNAME) > -1,
          use: {
            loader: "svg-url-loader",
            options: {},
          },
        },
        {
          test: /\.svg$/,
          // only process SVG modules with this loader when they don't live under a 'bgimages',
          // 'fonts', or 'pficon' directory, those are handled with other loaders
          include: (input) =>
            input.indexOf(BG_IMAGES_DIRNAME) === -1 &&
            input.indexOf("fonts") === -1 &&
            input.indexOf("background-filter") === -1 &&
            input.indexOf("pficon") === -1,
          use: {
            loader: "raw-loader",
            options: {},
          },
          type: "javascript/auto",
        },
        {
          test: /\.(jpg|jpeg|png|gif)$/i,
          include: [
            path.resolve(__dirname, "../src"),
            path.resolve(__dirname, "../../../node_modules/patternfly"),
            path.resolve(
              __dirname,
              "../../../node_modules/@patternfly/patternfly/assets/images"
            ),
            path.resolve(
              __dirname,
              "../../../node_modules/@patternfly/react-styles/css/assets/images"
            ),
            path.resolve(
              __dirname,
              "../../../node_modules/@patternfly/react-core/dist/styles/assets/images"
            ),
            path.resolve(
              __dirname,
              "../../../node_modules/@patternfly/react-core/node_modules/@patternfly/react-styles/css/assets/images"
            ),
            path.resolve(
              __dirname,
              "../../../node_modules/@patternfly/react-table/node_modules/@patternfly/react-styles/css/assets/images"
            ),
            path.resolve(
              __dirname,
              "../../../node_modules/@patternfly/react-inline-edit-extension/node_modules/@patternfly/react-styles/css/assets/images"
            ),
          ],
          use: [
            {
              loader: "url-loader",
              options: {
                limit: 5000,
                outputPath: "images",
                name: "[name].[ext]",
              },
            },
          ],
          type: "javascript/auto",
        },
        {
          test: path.resolve(__dirname, "../../../node_modules/xmllint/xmllint.js"),
          loader: "exports-loader",
          options: {
            exports: "xmllint",
          },
        },
      ],
    },
    plugins: [
      new Dotenv({
        systemvars: true,
        silent: true,
      }),
      new CopyPlugin({
        patterns: [
          {
            from: path.resolve(__dirname, "../public/locales"),
            to: path.resolve(__dirname, "../dist/locales"),
          },
          // TODO revisit to optimize ?
          {
            from: path.resolve(__dirname, "../public/manifest.json"),
            to: path.resolve(__dirname, "../dist/manifest.json"),
          },
          {
            from: path.resolve(
              __dirname,
              "../public/template_application_import.csv"
            ),
            to: path.resolve(
              __dirname,
              "../dist/template_application_import.csv"
            ),
          },
        ],
      }),
      new WatchIgnorePlugin({
        paths: [/\.js$/, /\.d\.ts$/],
      }),
    ],
    resolve: {
      alias: {
        "react-dom": "@hot-loader/react-dom",
      },
      extensions: [".js", ".ts", ".tsx", ".jsx"],
      plugins: [
        new TsconfigPathsPlugin({
          configFile: path.resolve(__dirname, "../tsconfig.json"),
        }),
      ],
      symlinks: false,
      cacheWithContext: false,
      fallback: { crypto: false, fs: false, path: false },
    },
    externals: {
      // required by xmllint (but not really used in the browser)
      ws: "{}",
    },
  };
};
