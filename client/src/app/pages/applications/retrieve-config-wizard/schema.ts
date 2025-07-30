import * as yup from "yup";
import { Application } from "@app/api/models";

export interface RetrieveConfigWizardFormValues {
  selectedApplications: Application[];
}

export const useRetrieveConfigWizardFormValidationSchema = ({
  applications,
}: {
  applications: Application[];
}) => {
  const applicationSchema = yup.object({
    selectedApplications: yup
      .array()
      .of(yup.object().required())
      .min(1, "At least one application must be selected"),
  });

  const reviewSchema = yup.object({
    selectedApplications: yup
      .array()
      .of(yup.object().required())
      .min(1, "At least one application must be selected"),
  });

  const schemas = [applicationSchema, reviewSchema];
  const allFieldsSchema = yup.object({
    selectedApplications: yup
      .array()
      .of(yup.object().required())
      .min(1, "At least one application must be selected"),
  });

  return { schemas, allFieldsSchema };
};
