/* eslint-env node */

import * as path from "path";

export const stylePaths = [
  // Include our sources
  path.resolve(__dirname, "../src"),

  // Include <PF4 paths
  path.resolve(__dirname, "../../node_modules/patternfly"),

  // Include >=PF4 paths, even if nested under another package because npm cannot hoist
  // a single package to the root node_modules/
  /node_modules\/@patternfly\/patternfly/,
  /node_modules\/@patternfly\/react-core\/.*\.css/,
  /node_modules\/@patternfly\/react-styles/,
];

// /* eslint-env node */

// import * as path from "path";

// export const stylePaths = [
//   path.resolve(__dirname, "../src"),
//   path.resolve(__dirname, "../../node_modules/patternfly"),
//   path.resolve(__dirname, "../../node_modules/@patternfly/patternfly"),
//   path.resolve(__dirname, "../../node_modules/@patternfly/react-styles/css"),
//   path.resolve(
//     __dirname,
//     "../../node_modules/@patternfly/react-core/dist/styles/base.css"
//   ),
//   path.resolve(
//     __dirname,
//     "../../node_modules/@patternfly/react-core/dist/esm/@patternfly/patternfly"
//   ),
//   path.resolve(
//     __dirname,
//     "../../node_modules/@patternfly/react-core/node_modules/@patternfly/react-styles/css"
//   ),
//   path.resolve(
//     __dirname,
//     "../../node_modules/@patternfly/react-table/node_modules/@patternfly/react-styles/css"
//   ),
//   path.resolve(
//     __dirname,
//     "../../node_modules/@patternfly/react-inline-edit-extension/node_modules/@patternfly/react-styles/css"
//   ),
// ];
