import * as yup from "yup";
import {
  isValidGitUrl,
  isValidStandardUrl,
  isValidSvnUrl,
} from "./utils/utils";

export {};
declare module "yup" {
  interface StringSchema {
    /**
     * Verify that a string is a valid repository URL and base the repository URL type
     * on the linked field name.  If the linked field's value is "git", use git URL validation.
     * If the linked field's value is "svn" or "subversion", use svn URL validation.  Any
     * other type will use standard URL validation.
     */
    repositoryUrl(repositoryTypeField: string, message?: string): StringSchema;
  }
}

yup.addMethod(
  yup.string,
  "repositoryUrl",
  function (
    repositoryTypeField: string,
    message = "Must be a valid repository URL."
  ) {
    return this.test("repositoryUrl", message, function (value) {
      const type = this.parent[repositoryTypeField];
      console.log("type", type, "value", value);
      if (value) {
        return type === "git"
          ? isValidGitUrl(value)
          : type === "svn" || type === "subversion"
            ? isValidSvnUrl(value)
            : isValidStandardUrl(value);
      }
      return false;
    });
  }
);
