// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

module.exports = {
  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: false,

  // The directory where Jest should output its coverage files
  coverageDirectory: "coverage",

  // An array of directory names to be searched recursively up from the requiring module's location
  moduleDirectories: ["node_modules", "<rootDir>/src"],

  // A map from regular expressions to module names that allow to stub out resources with a single module
  moduleNameMapper: {
    "\\.(css|less)$": "<rootDir>/__mocks__/styleMock.js",
    "@patternfly/react-icons/dist/esm/icons/":
      "<rootDir>/__mocks__/fileMock.js",
    "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$":
      "<rootDir>/__mocks__/fileMock.js",
    "@app/(.*)": "<rootDir>/src/app/$1",
  },

  // An array of file extensions your modules use. If you require modules without specifying a file extension,
  // these are the extensions Jest will look for, in left-to-right order.
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],

  // A preset that is used as a base for Jest's configuration
  preset: "ts-jest/presets/js-with-ts",

  // A list of paths to directories that Jest should use to search for files in.
  roots: ["<rootDir>/src"],

  // The test environment that will be used for testing.
  testEnvironment: "jsdom",

  // The pattern or patterns Jest uses to detect test files.
  testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$",

  // An array of regexp pattern strings that are matched against all test paths before executing the test.
  // If the test path matches any of the patterns, it will be skipped.
  testPathIgnorePatterns: ["/node_modules/"],

  // A map from regular expressions to paths to transformers.
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  // setupFiles: ["react-app-polyfill/jsdom"],
  setupFilesAfterEnv: ["<rootDir>/src/app/setupTests.ts"],
};
