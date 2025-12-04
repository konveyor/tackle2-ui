import { useTranslation } from "react-i18next";
import * as yup from "yup";

import {
  Application,
  Target,
  TargetLabel,
  UploadFile,
  UploadFileStatus,
} from "@app/api/models";

import { useAnalyzableApplicationsByMode } from "./utils";

// Analysis mode
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
  selectedTargets: Target[];
  selectedTargetLabels: TargetLabel[];
  targetFilters?: Record<string, string[]>;
}

export interface SetTargetsState extends SetTargetsValues {
  isValid: boolean;
}

export const useSetTargetsSchema = (): yup.SchemaOf<SetTargetsValues> => {
  return yup.object({
    selectedTargetLabels: yup.array(),
    selectedTargets: yup.array(),
    targetFilters: yup.object(),
  });
};

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
        withKnownLibs.includes("select") ? schema.min(1) : schema
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
  rulesKind: string;
  customRulesFiles: UploadFile[];
  repositoryType?: string;
  sourceRepository?: string;
  branch?: string;
  rootPath?: string;
  associatedCredentials?: string;
}

export interface CustomRulesStepState extends CustomRulesStepValues {
  isValid: boolean;
}

export const UploadFileSchema: yup.SchemaOf<UploadFile> = yup.object({
  fileId: yup.number().optional(),
  fileName: yup.string().required(),
  fullFile: yup.mixed<File>().required() as unknown as yup.SchemaOf<File>,
  uploadProgress: yup.number().required().min(0).max(100),
  status: yup
    .mixed<(typeof UploadFileStatus)[number]>()
    .oneOf([...UploadFileStatus])
    .required(),
  contents: yup.string().optional(),
  loadError: yup.string().optional(),
  responseID: yup.number().optional(),
});

export const useCustomRulesSchema = (): yup.SchemaOf<CustomRulesStepValues> => {
  return yup.object({
    rulesKind: yup.string().oneOf(["manual", "repository"]).defined(),

    // manual tab fields
    customRulesFiles: yup
      .array()
      .of(UploadFileSchema)
      .when("rulesKind", {
        is: "manual",
        then: yup.array().of(UploadFileSchema),
        otherwise: (schema) => schema,
      })
      .when(["selectedTargetLabels", "rulesKind", "selectedTargets"], {
        // TODO: Rewrite this when clause, input the fields via hook params
        is: (
          labels: TargetLabel[],
          rulesKind: string,
          selectedTargets: number
        ) =>
          labels.length === 0 && rulesKind === "manual" && selectedTargets <= 0,
        then: (schema) => schema.min(1, "At least 1 Rule File is required"),
      }),

    // repository tab fields
    repositoryType: yup.string().when("rulesKind", {
      is: "repository",
      then: (schema) => schema.oneOf(["git", "svn"]).required(),
    }),
    sourceRepository: yup.string().when("rulesKind", {
      is: "repository",
      then: (schema) => schema.repositoryUrl("repositoryType").required(),
    }),
    branch: yup.string().when("rulesKind", {
      is: "repository",
      then: yup.string(),
    }),
    rootPath: yup.string().when("rulesKind", {
      is: "repository",
      then: yup.string(),
    }),
    associatedCredentials: yup.string().when("rulesKind", {
      is: "repository",
      then: yup.string(),
    }),
  });
};

// Advanced options step
export interface AdvancedOptionsValues {
  selectedSourceLabels: TargetLabel[];
  excludedLabels: string[];
  autoTaggingEnabled: boolean;
  advancedAnalysisEnabled: boolean;
}

export interface AdvancedOptionsState extends AdvancedOptionsValues {
  isValid: boolean;
}

export const useAdvancedOptionsSchema =
  (): yup.SchemaOf<AdvancedOptionsValues> => {
    return yup.object({
      selectedSourceLabels: yup.array().of(
        yup.object().shape({
          name: yup.string().defined(),
          label: yup.string().defined(),
        })
      ),
      excludedLabels: yup.array().of(yup.string().defined()),
      autoTaggingEnabled: yup.bool().defined(),
      advancedAnalysisEnabled: yup.bool().defined(),
    });
  };
