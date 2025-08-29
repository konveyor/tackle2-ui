import path from "path";

import CopyPlugin from "copy-webpack-plugin";
import MonacoWebpackPlugin from "monaco-editor-webpack-plugin";
import { TsconfigPathsPlugin } from "tsconfig-paths-webpack-plugin";
import { Configuration, DefinePlugin } from "webpack";

import { brandingAssetPath } from "@konveyor-ui/common";

import { LANGUAGES_BY_FILE_EXTENSION } from "./monacoConstants";

const pathTo = (relativePath: string) => path.resolve(__dirname, relativePath);
const nodeModules = (pkg: string) => pathTo(`../../node_modules/${pkg}`);
const brandingPath = brandingAssetPath();
const manifestPath = path.resolve(brandingPath, "manifest.json");

const BG_IMAGES_DIRNAME = "images";

const config: Configuration = {
  entry: {
    app: [pathTo("../src/index.tsx")],
  },

  output: {
    path: pathTo("../dist"),
    publicPath: "auto",
    clean: true,
  },

  module: {
    rules: [
      {
        test: /\.[jt]sx?$/,
        exclude: /node_modules/,
        use: {
          loader: "ts-loader",
          options: {
            transpileOnly: true,
          },
        },
      },

      // Ref: https://github.com/patternfly/patternfly-react-seed/blob/main/webpack.common.js
      {
        test: /\.(svg|ttf|eot|woff|woff2)$/,
        type: "asset/resource",
        // only process modules with this loader
        // if they live under a 'fonts' or 'pficon' directory
        include: [
          nodeModules("patternfly/dist/fonts"),
          nodeModules("@patternfly/react-core/dist/styles/assets/fonts"),
          nodeModules("@patternfly/react-core/dist/styles/assets/pficon"),
          nodeModules("@patternfly/patternfly/assets/fonts"),
          nodeModules("@patternfly/patternfly/assets/pficon"),
        ],
      },
      {
        test: /\.svg$/,
        type: "asset/inline",
        include: (input) => input.indexOf("background-filter.svg") > 1,
        use: [
          {
            options: {
              limit: 5000,
              outputPath: "svgs",
              name: "[name].[ext]",
            },
          },
        ],
      },
      {
        test: /\.svg$/,
        // only process SVG modules with this loader if they live under a 'bgimages' directory
        // this is primarily useful when applying a CSS background using an SVG
        include: (input) => input.indexOf(BG_IMAGES_DIRNAME) > -1,
        type: "asset/inline",
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
      },
      {
        test: /\.(jpg|jpeg|png|gif)$/i,
        include: [
          pathTo("../src"),
          nodeModules("patternfly"),
          nodeModules("@patternfly/patternfly/assets/images"),
          nodeModules("@patternfly/react-styles/css/assets/images"),
          nodeModules("@patternfly/react-core/dist/styles/assets/images"),
          nodeModules(
            "@patternfly/react-core/node_modules/@patternfly/react-styles/css/assets/images"
          ),
          nodeModules(
            "@patternfly/react-table/node_modules/@patternfly/react-styles/css/assets/images"
          ),
          nodeModules(
            "@patternfly/react-inline-edit-extension/node_modules/@patternfly/react-styles/css/assets/images"
          ),
        ],
        type: "asset",
        parser: {
          dataUrlCondition: {
            maxSize: 8096,
          },
        },
      },

      // For monaco-editor-webpack-plugin --->
      {
        test: /\.css$/,
        include: [pathTo("../../node_modules/monaco-editor")],
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.ttf$/,
        type: "asset/resource",
      },
      // <--- For monaco-editor-webpack-plugin

      {
        test: /\.(xsd)$/,
        include: [pathTo("../src")],
        use: {
          loader: "raw-loader",
          options: {
            esModule: true,
          },
        },
      },
      {
        test: /\.yaml$/,
        use: "raw-loader",
      },
    ],
  },

  plugins: [
    new DefinePlugin({ "process.env": "{}" }),
    new CopyPlugin({
      patterns: [
        {
          from: pathTo("../public/locales"),
          to: "./locales/",
        },
        {
          from: pathTo("../public/templates"),
          to: "./templates/",
        },
        {
          from: manifestPath,
          to: ".",
        },
        {
          from: brandingPath,
          to: "./branding/",
        },
      ],
    }),
    new MonacoWebpackPlugin({
      filename: "monaco/[name].worker.js",
      languages: Object.values(LANGUAGES_BY_FILE_EXTENSION),
    }),
  ],

  resolve: {
    extensions: [".js", ".ts", ".tsx", ".jsx"],
    plugins: [
      new TsconfigPathsPlugin({
        configFile: pathTo("../tsconfig.json"),
      }),
    ],
    symlinks: false,
    cacheWithContext: false,
    fallback: { crypto: false, fs: false, path: false },
  },
};

export default config;
