import * as React from "react";
import * as yup from "yup";

export type AnalysisMode =
  | "binary"
  | "source-code"
  | "source-code-deps"
  | "binary-upload";

/*
export interface IAnalysisWizardFormValues {
  artifact: string;
  targets: string[];
  sources: string[];
  withKnown: string;
  includedPackages: string[];
  excludedPackages: string[];
  customRulesFiles: IReadFile[];
  excludedRulesTags: string[];
  diva: boolean;
  hasExcludedPackages: boolean;
  ruleTagToExclude: string;
}
*/

export interface ModeFormValues {
  mode: AnalysisMode;
}

export interface TargetsFormValues {
  targets: string[];
}

export interface ScopeFormValues {
  withKnown: "app" | "app,oss" | "app,oss,select"; // TODO can we make this an array? how does that affect api/models.tsx?
  includedPackages: string[];
  hasExcludedPackages: boolean;
  excludedPackages: string[];
}

export interface CustomRulesFormValues {}

export interface OptionsFormValues {}

// Only to be called once, at the top of the wizard.
// To consume these forms in each wizard step, use `React.useContext(AnalysisWizardFormContext)`
export const useAnalysisWizardFormState = () => {};

export type AnalysisWizardForms = ReturnType<typeof useAnalysisWizardFormState>;

/*
export const AnalysisWizardFormContext =
  React.createContext<AnalysisWizardForms>({} as AnalysisWizardForms);
*/

// TODO see slack -- use the new hook, keep one useForm with multiple compound schemas
