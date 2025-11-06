import { NOT_SOURCE_FILES, SOURCE_FILES } from "../.lintstagedrc.mjs";

export default {
  [SOURCE_FILES]: ["prettier --write", "eslint --fix"],
  [NOT_SOURCE_FILES]: "prettier --ignore-unknown --write",
};
