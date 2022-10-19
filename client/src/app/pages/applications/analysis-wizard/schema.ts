import * as React from "react";
import { useTranslation } from "react-i18next";
import * as yup from "yup";
import { IReadFile } from "./analysis-wizard";

export type AnalysisMode =
  | "binary"
  | "source-code"
  | "source-code-deps"
  | "binary-upload";

export type AnalysisScope = "app" | "app,oss" | "app,oss,select"; // TODO can we make this an array? how does that affect api/models.tsx?

// TODO there was originally an "artifact" string field, it appears unused?

export interface ModeFormValues {
  mode: AnalysisMode;
}

export interface TargetsFormValues {
  targets: string[];
}

export interface ScopeFormValues {
  withKnown: AnalysisScope; // TODO should this have another name?
  includedPackages: string[];
  hasExcludedPackages: boolean;
  excludedPackages: string[];
}

export interface CustomRulesFormValues {
  sources: string[];
  customRulesFiles: IReadFile[]; // TODO what's with this type?
}

export interface OptionsFormValues {
  diva: boolean; // TODO is there a better name for this?
  excludedRulesTags: string[];
}

export type AnalysisWizardFormValues = ModeFormValues &
  TargetsFormValues &
  ScopeFormValues &
  CustomRulesFormValues &
  OptionsFormValues;

export const useAnalysisWizardFormValidationSchema = () => {
  const { t } = useTranslation();

  const modeFormSchema: yup.SchemaOf<ModeFormValues> = yup.object({
    mode: yup.mixed<AnalysisMode>().required(t("validation.required")),
  });

  const targetsFormSchema: yup.SchemaOf<ModeFormValues & TargetsFormValues> =
    modeFormSchema.concat(
      yup.object({
        targets: yup.array().of(yup.string().defined()).min(1),
      })
    );

  const scopeFormSchema: yup.SchemaOf<
    ModeFormValues & TargetsFormValues & ScopeFormValues
  > = targetsFormSchema.concat(
    yup.object({
      withKnown: yup.string().required(),
      includedPackages: yup.array().of(yup.string().defined()),
      hasExcludedPackages: yup.bool().defined(),
      excludedPackages: yup.array().of(yup.string().defined()),
    })
  );

  // const allFieldsSchema: yup.SchemaOf<AnalysisWizardFormValues> =

  return {
    modeFormSchema,
    targetsFormSchema,
    allFieldsSchema,
  };
};
