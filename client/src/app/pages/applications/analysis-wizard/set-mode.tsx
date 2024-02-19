import React from "react";
import {
  SelectOptionProps,
  TextContent,
  Title,
  Alert,
  Form,
} from "@patternfly/react-core";
import { useTranslation } from "react-i18next";

import { UploadBinary } from "./components/upload-binary";
import { AnalysisWizardFormValues } from "./schema";
import { useFormContext } from "react-hook-form";
import { HookFormPFGroupController } from "@app/components/HookFormPFFields";
import { SimpleSelectBasic } from "@app/components/SimpleSelectBasic";

interface ISetMode {
  isSingleApp: boolean;
  isModeValid: boolean;
}

export const SetMode: React.FC<ISetMode> = ({ isSingleApp, isModeValid }) => {
  const { t } = useTranslation();

  const { watch, control, setValue } =
    useFormContext<AnalysisWizardFormValues>();
  const mode = watch("mode");

  const options: SelectOptionProps[] = [
    {
      value: "binary",
      children: "Binary",
    },
    {
      value: "source-code",
      children: "Source code",
    },
    {
      value: "source-code-deps",
      children: "Source code + dependencies",
    },
  ];

  if (isSingleApp)
    options.push({
      value: "binary-upload",
      children: "Upload a local binary",
    });

  return (
    <Form
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      <TextContent>
        <Title headingLevel="h3" size="xl">
          {t("wizard.terms.analysisMode")}
        </Title>
      </TextContent>
      <HookFormPFGroupController
        control={control}
        name="mode"
        label={t("wizard.label.analysisSource")}
        fieldId="analysis-mode"
        isRequired
        renderInput={({ field: { value, name, onChange } }) => (
          <SimpleSelectBasic
            selectId="analysis-mode"
            toggleId="analysis-mode-toggle"
            toggleAriaLabel="Analysis mode dropdown toggle"
            aria-label={name}
            value={value}
            onChange={onChange}
            options={options}
          />
        )}
      />
      {!isModeValid && (
        <Alert
          variant="warning"
          isInline
          title={t("wizard.label.notAllAnalyzable")}
        >
          <p>{t("wizard.label.notAllAnalyzableDetails")}</p>
        </Alert>
      )}
      {mode === "source-code" && (
        <Alert
          variant="info"
          isInline
          title={t("wizard.alert.sourceMode.title")}
        >
          <p>{t("wizard.alert.sourceMode.description")}</p>
        </Alert>
      )}
      {mode === "binary-upload" && <UploadBinary />}
    </Form>
  );
};
