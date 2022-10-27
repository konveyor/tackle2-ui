import { Application } from "@app/api/models";
import { useTranslation } from "react-i18next";
import * as yup from "yup";
import { IReadFile } from "./analysis-wizard";
import { filterAnalyzableApplications } from "./utils";

export type AnalysisMode =
  | "binary"
  | "source-code"
  | "source-code-deps"
  | "binary-upload";

export type AnalysisScope = "app" | "app,oss" | "app,oss,select"; // TODO can we make this an array? how does that affect api/models.tsx?

export interface ModeStepValues {
  mode: AnalysisMode;
  artifact: string;
}

const useModeStepSchema = ({
  applications,
}: {
  applications: Application[];
}): yup.SchemaOf<ModeStepValues> => {
  const { t } = useTranslation();
  return yup.object({
    mode: yup
      .mixed<AnalysisMode>()
      .required(t("validation.required"))
      .test(
        "isModeCompatible",
        "Selected mode not supported for selected applications", // Message not exposed to the user
        (mode) => {
          const analyzableApplications = mode
            ? filterAnalyzableApplications(applications, mode)
            : [];
          if (mode === "binary-upload") {
            return analyzableApplications.length === 1;
          }
          return analyzableApplications.length > 0;
        }
      ),
    artifact: yup
      .string()
      .defined()
      .when("mode", {
        is: "binary-upload",
        then: (schema) => schema.required(),
      }),
  });
};

export interface TargetsStepValues {
  targets: string[];
}

const useTargetsStepSchema = (): yup.SchemaOf<TargetsStepValues> => {
  const { t } = useTranslation();
  return yup.object({
    targets: yup.array().of(yup.string().defined()).min(1),
  });
};

export interface ScopeStepValues {
  withKnown: AnalysisScope; // TODO should this have another name?
  includedPackages: string[];
  hasExcludedPackages: boolean;
  excludedPackages: string[];
}

const useScopeStepSchema = (): yup.SchemaOf<ScopeStepValues> => {
  const { t } = useTranslation();
  return yup.object({
    withKnown: yup.mixed<AnalysisScope>().required(t("validation.required")),
    includedPackages: yup.array().of(yup.string().defined()),
    hasExcludedPackages: yup.bool().defined(),
    excludedPackages: yup.array().of(yup.string().defined()),
  });
};

export interface CustomRulesStepValues {
  sources: string[];
  customRulesFiles: IReadFile[]; // TODO what's with this type?
}

const useCustomRulesStepSchema = (): yup.SchemaOf<CustomRulesStepValues> => {
  const { t } = useTranslation();
  return yup.object({
    sources: yup.array().of(yup.string().defined()),
    customRulesFiles: yup.array().of(yup.object() as yup.SchemaOf<IReadFile>), // TODO is there something better here?
  });
};

export interface OptionsStepValues {
  diva: boolean; // TODO is there a better name for this?
  excludedRulesTags: string[];
}

const useOptionsStepSchema = (): yup.SchemaOf<OptionsStepValues> => {
  const { t } = useTranslation();
  return yup.object({
    diva: yup.bool().defined(),
    excludedRulesTags: yup.array().of(yup.string().defined()),
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
