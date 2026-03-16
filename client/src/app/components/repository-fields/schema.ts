import { TFunction } from "i18next";
import { get, template } from "radash";
import { FieldPath } from "react-hook-form";
import * as yup from "yup";

import { RepositoryKind } from "@app/hooks/useRepositoryKind";

import { isNotEmptyString } from "./model-utils";

export interface RepositorySchemaOptions {
  /** Translation function for error messages */
  t?: TFunction | ((k: string, v?: Record<string, unknown>) => string);

  /** Whether the repository fields are required (e.g., when rulesKind is "repository") */
  isRequired?: boolean | (() => boolean);

  /** Allow empty string for kind when no repoUrl is provided */
  allowEmptyKind?: boolean;

  /** Allowed repository kinds (defaults to ["", "git", "subversion"]) */
  allowedKinds?: RepositoryKind[];

  /** Default repository kind (defaults to "git") */
  defaultKind?: RepositoryKind;
}

const DEFAULT_MESSAGES = {
  validation: {
    repositoryTypeRequiredWhen:
      "Repository type is required when URL, branch, or path is specified.",
    repositoryUrlRequiredWhen:
      "Repository URL is required when branch or path is specified.",
    repositoryTypeRequired: "Repository type is required.",
    repositoryUrlRequired: "Repository URL is required.",
    maxLength: "Maximum length is {{length}} characters.",
    repositoryUrlInvalid: "Must be a valid repository URL.",
  },
};

const DEFAULT_T = (
  key: FieldPath<typeof DEFAULT_MESSAGES>,
  options?: Record<string, unknown>
) => {
  const message = get(DEFAULT_MESSAGES, key) as string;
  return options ? template(message, options) : message;
};

/**
 * Creates a schema for repository fields (kind, url, branch, path).
 * This method can be chained on yup.object() to add repository field validation.
 *
 * This handles the interdependencies between these fields:
 * - kind can be empty only when url is not provided
 * - url is required when branch or path is specified
 * - All fields can be conditionally required based on context
 */
export const yupRepositoryFields = ({
  t: tFromOptions,
  isRequired = false,
  allowEmptyKind = true,
  allowedKinds = ["", "git", "subversion"],
}: RepositorySchemaOptions = {}) => {
  const t = tFromOptions ?? DEFAULT_T;
  const checkIsRequired = () =>
    typeof isRequired === "function" ? isRequired() : isRequired;

  const kindSchema = yup
    .string()
    .oneOf(
      allowEmptyKind ? allowedKinds : allowedKinds.filter(isNotEmptyString)
    )
    .when(["url", "branch", "path"], {
      is: (url: string, branch: string, path: string) =>
        isNotEmptyString(url) ||
        isNotEmptyString(branch) ||
        isNotEmptyString(path),
      then: (schema) =>
        schema.required(t("validation.repositoryTypeRequiredWhen")),
    })
    .test({
      name: "required",
      message: t("validation.repositoryTypeRequired"),
      exclusive: true,
      test: function (value) {
        if (checkIsRequired()) {
          return isNotEmptyString(value);
        }
        return true;
      },
    });

  const urlSchema = yup
    .string()
    .when(["branch", "path"], {
      is: (branch: string, path: string) =>
        isNotEmptyString(branch) || isNotEmptyString(path),
      then: (schema) =>
        schema.required(t("validation.repositoryUrlRequiredWhen")),
    })
    .when("kind", (kind: string, schema) => {
      const isKindPresent = isNotEmptyString(kind);
      const isExplicitlyRequired = checkIsRequired();

      if (isKindPresent && isExplicitlyRequired) {
        schema = schema.required(t("validation.repositoryUrlRequiredWhen"));
      }
      if (isKindPresent) {
        schema = schema.repositoryUrl(
          "kind",
          !isExplicitlyRequired,
          t("validation.repositoryUrlInvalid")
        );
      }

      return schema;
    });

  const maxLengthMessage = t("validation.maxLength", { length: 250 });

  const branchSchema = yup.string().trim().max(250, maxLengthMessage);

  const pathSchema = yup.string().trim().max(250, maxLengthMessage);

  return yup.object().shape(
    {
      kind: kindSchema,
      url: urlSchema,
      branch: branchSchema,
      path: pathSchema,
    },
    // Handle circular dependencies between fields
    [
      ["kind", "url"],
      ["url", "branch"],
      ["url", "path"],
    ]
  );
};
