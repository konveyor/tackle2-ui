import * as React from "react";
import { FormProvider, useForm } from "react-hook-form";
import { Application, Task, TaskData } from "@app/api/models";
import "./wizard.css";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import schema from "yup/lib/schema";
import { AnalysisWizardContainer } from "./analysis-wizard-container";

interface IAnalysisWizard {
  applications: Application[];
  onClose: () => void;
}

export interface IAnalysisWizardFormValues {
  mode: string;
  targets: string[];
  sources: string[];
  withKnown: string;
  includedPackages: string[];
  excludedPackages: string[];
  customRulesFiles: any;
  excludedRulesTags: string[];
}

export const AnalysisWizard: React.FunctionComponent<IAnalysisWizard> = ({
  applications,
  onClose,
}: IAnalysisWizard) => {
  const schema = yup
    .object({
      mode: yup.string().required(),
      target: yup.array().min(1, "Select one or more target"),
    })
    .required();
  const methods = useForm<IAnalysisWizardFormValues>({
    resolver: yupResolver(schema),
    defaultValues: {
      mode: "Binary",
      targets: [],
      sources: [],
      withKnown: "",
      includedPackages: [""],
      excludedPackages: [""],
      customRulesFiles: [],
      excludedRulesTags: [""],
    },
  });
  return (
    <FormProvider {...methods}>
      <AnalysisWizardContainer applications={applications} onClose={onClose} />
    </FormProvider>
  );
};
