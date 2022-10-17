import * as React from "react";
import * as yup from "yup";
import { IReadFile } from "./analysis-wizard";

export type AnalysisMode =
  | "binary"
  | "source-code"
  | "source-code-deps"
  | "binary-upload";

// TODO there was originally an "artifact" string field, it appears unused?

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

export interface CustomRulesFormValues {
  sources: string[];
  customRulesFiles: IReadFile[]; // TODO what's with this type?
}

export interface OptionsFormValues {
  diva: boolean; // TODO is there a better name for this?
  excludedRulesTags: string[];
}

// Only to be called once at the top of the wizard.
// To consume these forms in each wizard step, use `useFormContext` from react-hook-form.
export const useAnalysisWizardFormState = () => {};

// TODO do we need this?
export type AnalysisWizardFormState = ReturnType<
  typeof useAnalysisWizardFormState
>;

// TODO see slack -- use the new hook, keep one useForm with multiple compound schemas
