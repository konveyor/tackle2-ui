export const SOURCE_FILES = "{,.}*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}";
export const NOT_SOURCE_FILES = `!(package-lock.json|${SOURCE_FILES})`;

/** @type {import("lint-staged").Configuration} */
export default {
  // Special handler for package-lock.json
  "package-lock.json": "./scripts/verify_lock.mjs",

  // JavaScript/TypeScript files (including dotfiles) - run prettier then eslint
  [SOURCE_FILES]: ["prettier --write", "eslint --fix"],

  // Any other files in any directory not already handled by the above globs, and that
  // do not have overriding lint-staged config
  [NOT_SOURCE_FILES]: "prettier --ignore-unknown --write",
};
