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
      withKnown: yup.mixed<AnalysisScope>().required(t("validation.required")),
      includedPackages: yup.array().of(yup.string().defined()),
      hasExcludedPackages: yup.bool().defined(),
      excludedPackages: yup.array().of(yup.string().defined()),
    })
  );

  const customRulesFormSchema: yup.SchemaOf<
    ModeFormValues & TargetsFormValues & ScopeFormValues & CustomRulesFormValues
  > = scopeFormSchema.concat(
    yup.object({
      sources: yup.array().of(yup.string().defined()),
      customRulesFiles: yup.array().of(yup.object() as yup.SchemaOf<IReadFile>), // TODO is there something better here?
    })
  );

  const optionsFormSchema: yup.SchemaOf<AnalysisWizardFormValues> =
    customRulesFormSchema.concat(
      yup.object({
        diva: yup.bool().defined(),
        excludedRulesTags: yup.array().of(yup.string().defined()),
      })
    );

  return {
    modeFormSchema,
    targetsFormSchema,
    scopeFormSchema,
    customRulesFormSchema,
    optionsFormSchema,
    allFieldsSchema: optionsFormSchema,
  };
};
