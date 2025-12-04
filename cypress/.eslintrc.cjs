/* eslint-env node */

module.exports = {
  root: false, // let workspace override root config
  extends: [], // do NOT inherit root ESLint rules

  parserOptions: {
    sourceType: "module",
  },

  rules: {
    "@typescript-eslint/no-require-imports": "off",
    "@typescript-eslint/no-var-requires": "off",
    "@typescript-eslint/ban-types": "off",
    "@typescript-eslint/ban-ts-comment": "off",
  },
};
