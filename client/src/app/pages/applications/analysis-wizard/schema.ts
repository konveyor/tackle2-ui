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

export const ANALYSIS_MODES = [
  "binary",
  "source-code",
  "source-code-deps",
  "binary-upload",
] as const;
export type AnalysisMode = (typeof ANALYSIS_MODES)[number];

export type AnalysisScope = "app" | "app,oss" | "app,oss,select";

export interface ModeStepValues {
  mode: AnalysisMode;
  artifact: File | undefined | null;
}

const useModeStepSchema = ({
  applications,
}: {
  applications: Application[];
}): yup.SchemaOf<ModeStepValues> => {
  const { t } = useTranslation();
  const analyzableAppsByMode = useAnalyzableApplicationsByMode(applications);
  return yup.object({
    mode: yup
      .mixed<AnalysisMode>()
      .required(t("validation.required"))
      .test(
        "isModeCompatible",
        "Selected mode not supported for selected applications", // Message not exposed to the user
        (mode) => {
          const analyzableApplications = mode ? analyzableAppsByMode[mode] : [];
          if (mode === "binary-upload") {
            return analyzableApplications.length === 1;
          }
          return analyzableApplications.length > 0;
        }
      ),
    artifact: yup.mixed<File>().when("mode", {
      is: "binary-upload",
      then: (schema) => schema.required(),
    }),
  });
};

export interface TargetsStepValues {
  selectedTargets: Target[];
  selectedTargetLabels: TargetLabel[];
  targetFilters?: Record<string, string[]>;
}

const useTargetsStepSchema = (): yup.SchemaOf<TargetsStepValues> => {
  return yup.object({
    selectedTargetLabels: yup.array(),
    selectedTargets: yup.array(),
    targetFilters: yup.object(),
  });
};

export interface ScopeStepValues {
  withKnownLibs: AnalysisScope;
  includedPackages: string[];
  hasExcludedPackages: boolean;
  excludedPackages: string[];
}

const useScopeStepSchema = (): yup.SchemaOf<ScopeStepValues> => {
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

export interface CustomRulesStepValues {
  customRulesFiles: UploadFile[];
  rulesKind: string;
  repositoryType?: string;
  sourceRepository?: string;
  branch?: string;
  rootPath?: string;
  associatedCredentials?: string;
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

const useCustomRulesStepSchema = (): yup.SchemaOf<CustomRulesStepValues> => {
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

export interface OptionsStepValues {
  excludedRulesTags: string[];
  autoTaggingEnabled: boolean;
  advancedAnalysisEnabled: boolean;
  selectedSourceLabels: TargetLabel[];
}

const useOptionsStepSchema = (): yup.SchemaOf<OptionsStepValues> => {
  return yup.object({
    excludedRulesTags: yup.array().of(yup.string().defined()),
    autoTaggingEnabled: yup.bool().defined(),
    advancedAnalysisEnabled: yup.bool().defined(),
    selectedSourceLabels: yup.array().of(
      yup.object().shape({
        name: yup.string().defined(),
        label: yup.string().defined(),
      })
    ),
  });
};

export type AnalysisWizardFormValues = ModeStepValues &
  TargetsStepValues &
  ScopeStepValues &
  CustomRulesStepValues &
  OptionsStepValues;

export interface AnalysisWizardFormValidationSchema {
  schemas: {
    modeStep: yup.SchemaOf<ModeStepValues>;
    targetsStep: yup.SchemaOf<TargetsStepValues>;
    scopeStep: yup.SchemaOf<ScopeStepValues>;
    customRulesStep: yup.SchemaOf<CustomRulesStepValues>;
    optionsStep: yup.SchemaOf<OptionsStepValues>;
  };
  allFieldsSchema: yup.SchemaOf<AnalysisWizardFormValues>;
}

export const useAnalysisWizardFormValidationSchema = ({
  applications,
}: {
  applications: Application[];
}): AnalysisWizardFormValidationSchema => {
  const schemas = {
    modeStep: useModeStepSchema({ applications }),
    targetsStep: useTargetsStepSchema(),
    scopeStep: useScopeStepSchema(),
    customRulesStep: useCustomRulesStepSchema(),
    optionsStep: useOptionsStepSchema(),
  };
  const allFieldsSchema: yup.SchemaOf<AnalysisWizardFormValues> =
    schemas.modeStep
      .concat(schemas.targetsStep)
      .concat(schemas.scopeStep)
      .concat(schemas.customRulesStep)
      .concat(schemas.optionsStep);
  return {
    schemas,
    allFieldsSchema,
  };
};
