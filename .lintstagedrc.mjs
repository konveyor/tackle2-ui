export default {
  // Special handler for package-lock.json
  "package-lock.json": "./scripts/verify_lock.mjs",

  // JavaScript/TypeScript files (including dotfiles) - run eslint
  "{,.}*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}": "eslint --fix",

  // YAML files in .github - run prettier
  ".github/**/*.{yaml,yml}": "prettier --ignore-unknown --write",

  // Any other files in any directory that doesn't have its own lint-staged config (but excludes package-lock.json)
  "!(package-lock.json)*": "prettier --ignore-unknown --write",
};

