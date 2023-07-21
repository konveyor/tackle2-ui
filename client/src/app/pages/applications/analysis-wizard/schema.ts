import * as yup from "yup";
import {
  Application,
  IReadFile,
  Ref,
  Repository,
  Ruleset,
  RulesetImage,
  RulesetKind,
  FileLoadError,
} from "@app/api/models";
import { useTranslation } from "react-i18next";
import { useAnalyzableApplicationsByMode } from "./utils";
import { customURLValidation } from "@app/utils/utils";

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
  formTargets: string[];
  formOtherLabels: string[];
  formRulesets: Ruleset[];
}
export const rulesetSchema: yup.SchemaOf<Ruleset> = yup.object({
  createTime: yup.string(),
  createUser: yup.string(),
  description: yup.string(),
  id: yup.number().required(),
  name: yup.string().required(),
  image: yup.mixed<RulesetImage>(),
  kind: yup.mixed<RulesetKind>(),
  rules: yup.array(),
  custom: yup.boolean(),
  repository: yup.mixed<Repository>(),
  identity: yup.mixed<Ref>(),
  updateUser: yup.string(),
});

const useTargetsStepSchema = (): yup.SchemaOf<TargetsStepValues> => {
  const { t } = useTranslation();
  return yup.object({
    formTargets: yup.array(),
    formOtherLabels: yup.array(),
    formRulesets: yup.array().of(rulesetSchema),
  });
};

export interface ScopeStepValues {
  withKnown: AnalysisScope;
  includedPackages: string[];
  hasExcludedPackages: boolean;
  excludedPackages: string[];
}

const useScopeStepSchema = (): yup.SchemaOf<ScopeStepValues> => {
  const { t } = useTranslation();
  return yup.object({
    withKnown: yup.mixed<AnalysisScope>().required(t("validation.required")),
    includedPackages: yup
      .array()
      .of(yup.string().defined())
      .when("withKnown", (withKnown, schema) =>
        withKnown.includes("select") ? schema.min(1) : schema
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
  formSources: string[];
  selectedFormSources: string[];
  customRulesFiles: IReadFile[];
  rulesKind: string;
  repositoryType?: string;
  sourceRepository?: string;
  branch?: string;
  rootPath?: string;
  associatedCredentials?: string;
}
export const customRulesFilesSchema: yup.SchemaOf<IReadFile> = yup.object({
  fileName: yup.string().required(),
  fullFile: yup.mixed<File>(),
  loadError: yup.mixed<FileLoadError>(),
  loadPercentage: yup.number(),
  loadResult: yup.mixed<"danger" | "success" | undefined>(),
  data: yup.string(),
  responseID: yup.number(),
});

const useCustomRulesStepSchema = (): yup.SchemaOf<CustomRulesStepValues> => {
  const { t } = useTranslation();
  return yup.object({
    selectedFormSources: yup.array().of(yup.string().defined()),
    formSources: yup.array().of(yup.string().defined()),
    rulesKind: yup.string().defined(),
    customRulesFiles: yup
      .array()
      .of(customRulesFilesSchema)
      .when("rulesKind", {
        is: "manual",
        then: yup.array().of(customRulesFilesSchema),
        otherwise: (schema) => schema,
      })
      .when(["formRulesets", "rulesKind"], {
        is: (rulesets: Ruleset[], rulesKind: string) =>
          rulesets.length === 0 && rulesKind === "manual",
        then: (schema) => schema.min(1, "At least 1 Rule File is required"), // TODO translation here
      }),
    repositoryType: yup.mixed<string>().when("rulesKind", {
      is: "repository",
      then: yup.mixed<string>().required(),
    }),
    sourceRepository: yup.string().when("rulesKind", {
      is: "repository",
      then: (schema) =>
        customURLValidation(schema).required("Enter repository url."),
    }),
    branch: yup.mixed<string>().when("rulesKind", {
      is: "repository",
      then: yup.mixed<string>(),
    }),
    rootPath: yup.mixed<string>().when("rulesKind", {
      is: "repository",
      then: yup.mixed<string>(),
    }),
    associatedCredentials: yup.mixed<any>().when("rulesKind", {
      is: "repository",
      then: yup.mixed<any>(),
    }),
  });
};

export interface OptionsStepValues {
  diva: boolean;
  excludedRulesTags: string[];
  autoTaggingEnabled: boolean;
}

const useOptionsStepSchema = (): yup.SchemaOf<OptionsStepValues> => {
  const { t } = useTranslation();
  return yup.object({
    diva: yup.bool().defined(),
    excludedRulesTags: yup.array().of(yup.string().defined()),
    autoTaggingEnabled: yup.bool().defined(),
  });
};

export type AnalysisWizardFormValues = ModeStepValues &
  TargetsStepValues &
  ScopeStepValues &
  CustomRulesStepValues &
  OptionsStepValues;

export const useAnalysisWizardFormValidationSchema = ({
  applications,
}: {
  applications: Application[];
}) => {
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
