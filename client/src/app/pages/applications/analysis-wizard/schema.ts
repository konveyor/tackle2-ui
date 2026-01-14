import { useTranslation } from "react-i18next";
import * as yup from "yup";

import {
  AnalysisProfile,
  Application,
  Target,
  TargetLabel,
  UploadFile,
} from "@app/api/models";
import { TargetLabelSchema, UploadFileSchema } from "@app/api/schemas";
import { duplicateNameCheck } from "@app/utils/utils";

import { useAnalyzableApplicationsByMode } from "./utils";

// Wizard flow mode - Manual vs Analysis Profile
export type WizardFlowMode = "manual" | "profile";

export interface WizardFlowModeValues {
  flowMode: WizardFlowMode;
  selectedProfile: AnalysisProfile | null;
}

export interface WizardFlowModeState extends WizardFlowModeValues {
  isValid: boolean;
}

// Analysis mode (source)
export const ANALYSIS_MODES = [
  "binary",
  "source-code",
  "source-code-deps",
  "binary-upload",
] as const;
export type AnalysisMode = (typeof ANALYSIS_MODES)[number];

export interface AnalysisModeValues {
  mode: AnalysisMode;
  artifact: File | undefined | null;
}

export interface AnalysisModeState extends AnalysisModeValues {
  isValid: boolean;
}

export const useAnalysisModeSchema = ({
  applications,
  messageNotCompatible,
}: {
  applications: Application[];
  messageNotCompatible: string;
}): yup.SchemaOf<AnalysisModeValues> => {
  const { t } = useTranslation();
  const analyzableAppsByMode = useAnalyzableApplicationsByMode(applications);
  return yup.object({
    mode: yup
      .mixed<AnalysisMode>()
      .required(t("validation.required"))
      .test("isModeCompatible", messageNotCompatible, (mode) => {
        const analyzableApplications = mode ? analyzableAppsByMode[mode] : [];
        return mode === "binary-upload"
          ? analyzableApplications.length === 1
          : analyzableApplications.length > 0;
      }),
    artifact: yup.mixed<File>().when("mode", {
      is: "binary-upload",
      then: (schema) => schema.required(),
    }),
  });
};

// Set targets step
export interface SetTargetsValues {
  targetStatus: Record<
    number,
    {
      target: Target;
      isSelected: boolean;
      choiceTargetLabel?: TargetLabel;
    }
  >;
  selectedTargets: [Target, TargetLabel | null][];
  targetFilters?: Record<string, string[]>;
}

export interface SetTargetsState extends SetTargetsValues {
  isValid: boolean;
}

// Scope step
export type AnalysisScope = "app" | "app,oss" | "app,oss,select";

export interface AnalysisScopeValues {
  withKnownLibs: AnalysisScope;
  includedPackages: string[];
  hasExcludedPackages: boolean;
  excludedPackages: string[];
}

export interface AnalysisScopeState extends AnalysisScopeValues {
  isValid: boolean;
}

export const useAnalysisScopeSchema = (): yup.SchemaOf<AnalysisScopeValues> => {
  const { t } = useTranslation();
  return yup.object({
    withKnownLibs: yup
      .mixed<AnalysisScope>()
      .required(t("validation.required")),
    includedPackages: yup
      .array()
      .of(yup.string().defined())
      .when("withKnownLibs", (withKnownLibs, schema) =>
        withKnownLibs?.includes("select") ? schema.min(1) : schema
      ),
    hasExcludedPackages: yup.bool().defined(),
    excludedPackages: yup
      .array()
      .of(yup.string().defined())
      .when("hasExcludedPackages", (hasExcludedPackages, schema) =>
        hasExcludedPackages ? schema.min(1) : schema
      ),
  });
};

// Custom rules step
export interface CustomRulesStepValues {
  rulesKind: "manual" | "repository";
  customRulesFiles: UploadFile[];
  customLabels: TargetLabel[];
  repositoryType?: string;
  sourceRepository?: string;
  branch?: string;
  rootPath?: string;
  associatedCredentials?: string;
}

export interface CustomRulesStepState extends CustomRulesStepValues {
  isValid: boolean;
}

export const useCustomRulesSchema = ({
  isCustomRuleRequired,
}: {
  isCustomRuleRequired: boolean;
}): yup.SchemaOf<CustomRulesStepValues> => {
  return yup.object({
    rulesKind: yup.mixed<"manual" | "repository">().required(),

    // manual tab fields
    customRulesFiles: yup
      .array()
      .of(UploadFileSchema)
      .when("rulesKind", {
        is: "manual",
        then: (schema) =>
          isCustomRuleRequired
            ? schema.min(1, "At least 1 Rule File is required")
            : schema,
        otherwise: (schema) => schema,
      }),
    customLabels: yup.array().of(TargetLabelSchema),

    // repository tab fields
    repositoryType: yup.string().when("rulesKind", {
      is: "repository",
      then: (schema) => schema.oneOf(["git", "svn"]).required(),
    }),
    sourceRepository: yup.string().when("rulesKind", {
      is: "repository",
      then: (schema) => schema.repositoryUrl("repositoryType").required(),
    }),
    branch: yup.string(),
    rootPath: yup.string(),
    associatedCredentials: yup.string(),
  });
};

// Advanced options step
export interface AdvancedOptionsValues {
  additionalTargetLabels: TargetLabel[];
  additionalSourceLabels: TargetLabel[];

  excludedLabels: string[];
  autoTaggingEnabled: boolean;
  advancedAnalysisEnabled: boolean;

  saveAsProfile: boolean;
  profileName?: string;
}

export interface AdvancedOptionsState extends AdvancedOptionsValues {
  isValid: boolean;
}

export const useAdvancedOptionsSchema = (
  existingProfiles: AnalysisProfile[] = []
): yup.SchemaOf<AdvancedOptionsValues> => {
  const { t } = useTranslation();
  return yup.object({
    additionalTargetLabels: yup.array().of(TargetLabelSchema),
    additionalSourceLabels: yup.array().of(TargetLabelSchema),
    excludedLabels: yup.array().of(yup.string().defined()),
    autoTaggingEnabled: yup.bool().defined(),
    advancedAnalysisEnabled: yup.bool().defined(),
    saveAsProfile: yup.bool().defined(),
    profileName: yup.string().when("saveAsProfile", {
      is: true,
      then: (schema) =>
        schema
          .required()
          .test(
            "unique-name",
            t("validation.duplicateAnalysisProfileName"),
            (value) => duplicateNameCheck(existingProfiles, null, value ?? "")
          ),
    }),
  });
};
