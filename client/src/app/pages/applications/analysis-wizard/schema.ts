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

const useModeFormSchema = (): yup.SchemaOf<ModeFormValues> => {
  const { t } = useTranslation();
  return yup.object({
    mode: yup.mixed<AnalysisMode>().required(t("validation.required")),
  });
};

export interface TargetsFormValues {
  targets: string[];
}

const useTargetsFormSchema = (): yup.SchemaOf<TargetsFormValues> => {
  const { t } = useTranslation();
  return yup.object({
    targets: yup.array().of(yup.string().defined()).min(1),
  });
};

export interface ScopeFormValues {
  withKnown: AnalysisScope; // TODO should this have another name?
  includedPackages: string[];
  hasExcludedPackages: boolean;
  excludedPackages: string[];
}

const useScopeFormSchema = (): yup.SchemaOf<ScopeFormValues> => {
  const { t } = useTranslation();
  return yup.object({
    withKnown: yup.mixed<AnalysisScope>().required(t("validation.required")),
    includedPackages: yup.array().of(yup.string().defined()),
    hasExcludedPackages: yup.bool().defined(),
    excludedPackages: yup.array().of(yup.string().defined()),
  });
};

export interface CustomRulesFormValues {
  sources: string[];
  customRulesFiles: IReadFile[]; // TODO what's with this type?
}

const useCustomRulesFormSchema = (): yup.SchemaOf<CustomRulesFormValues> => {
  const { t } = useTranslation();
  return yup.object({
    sources: yup.array().of(yup.string().defined()),
    customRulesFiles: yup.array().of(yup.object() as yup.SchemaOf<IReadFile>), // TODO is there something better here?
  });
};

export interface OptionsFormValues {
  diva: boolean; // TODO is there a better name for this?
  excludedRulesTags: string[];
}

const useOptionsFormSchema = (): yup.SchemaOf<OptionsFormValues> => {
  const { t } = useTranslation();
  return yup.object({
    diva: yup.bool().defined(),
    excludedRulesTags: yup.array().of(yup.string().defined()),
  });
};

export type AnalysisWizardFormValues = ModeFormValues &
  TargetsFormValues &
  ScopeFormValues &
  CustomRulesFormValues &
  OptionsFormValues;

export const useAnalysisWizardFormValidationSchema = () => {
  const schemas = {
    modeForm: useModeFormSchema(),
    targetsForm: useTargetsFormSchema(),
    scopeForm: useScopeFormSchema(),
    customRulesForm: useCustomRulesFormSchema(),
    optionsForm: useOptionsFormSchema(),
  };
  const allFieldsSchema: yup.SchemaOf<AnalysisWizardFormValues> =
    schemas.modeForm
      .concat(schemas.targetsForm)
      .concat(schemas.scopeForm)
      .concat(schemas.customRulesForm)
      .concat(schemas.optionsForm);
  return {
    schemas,
    allFieldsSchema,
  };
};
