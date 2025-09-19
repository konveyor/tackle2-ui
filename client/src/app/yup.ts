import * as yup from "yup";

import { validateSettingsXml } from "@app/utils/maven-settings";
import {
  isValidGitUrl,
  isValidStandardUrl,
  isValidSvnUrl,
} from "@app/utils/utils";

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

    validMavenSettingsXml(
      skipValidation?: (value?: string) => boolean
    ): StringSchema;
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

yup.addMethod(
  yup.string,
  "validMavenSettingsXml",
  function (skipValidation?: (value?: string) => boolean) {
    return this.test("validMavenSettingsXml", async function (value) {
      if (skipValidation?.(value) ?? false) return true;

      let resp: boolean | yup.ValidationError = false;
      try {
        resp = await validateSettingsXml(value);
      } catch (e) {
        resp = this.createError({
          message: (e as Error).message,
          path: "settings",
        });
      }
      return resp;
    });
  }
);
