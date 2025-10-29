export default {
  // Special handler for package-lock.json
  "package-lock.json": "./scripts/verify_lock.mjs",

  // JavaScript/TypeScript files (including dotfiles) - run eslint
  "{,.}*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}": "eslint --fix",

  // Any other files in any directory not already handled by the above globs, and that
  // do not have overriding lint-staged config
  "!(package-lock.json|{,.}*.{js,cjs,mjs,jsx,ts,cts,mts,tsx})*": "prettier --ignore-unknown --write",
};

