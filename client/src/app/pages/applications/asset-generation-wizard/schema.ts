import * as yup from "yup";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Application, Generator, Target } from "@app/api/models";

export interface AssetGenerationWizardFormValues {
  selectedApplications: Application[];
  selectedTargetProfile: Target | null;
  selectedGenerator: Generator | null;
}

interface AssetGenerationWizardSchemaProps {
  applications: Application[];
}

export const useAssetGenerationWizardFormValidationSchema = ({
  applications,
}: AssetGenerationWizardSchemaProps) => {
  const { t } = useTranslation();

  const schemas = useMemo(() => {
    const setApplicationsSchema = yup.object().shape({
      selectedApplications: yup
        .array()
        .of(yup.object())
        .min(1, t("validation.minOneApplication"))
        .required(t("validation.required")),
    });

    const setTargetProfileSchema = yup.object().shape({
      selectedTargetProfile: yup.object().nullable().optional(),
    });

    const setGeneratorSchema = yup.object().shape({
      selectedGenerator: yup.object().nullable().optional(),
    });

    return {
      setApplications: setApplicationsSchema,
      setTargetProfile: setTargetProfileSchema,
      setGenerator: setGeneratorSchema,
    };
  }, [t]);

  const allFieldsSchema = useMemo(
    () =>
      yup.object().shape({
        ...schemas.setApplications.fields,
        ...schemas.setTargetProfile.fields,
        ...schemas.setGenerator.fields,
      }),
    [schemas]
  );

  return { schemas, allFieldsSchema };
};
