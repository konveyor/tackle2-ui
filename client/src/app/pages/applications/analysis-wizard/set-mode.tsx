import React from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Form,
  SelectOptionProps,
  TextContent,
  Title,
} from "@patternfly/react-core";

import { HookFormPFGroupController } from "@app/components/HookFormPFFields";
import { SimpleSelectBasic } from "@app/components/SimpleSelectBasic";

import { UploadBinary } from "./components/upload-binary";
import { AnalysisWizardFormValues } from "./schema";

interface ISetMode {
  isSingleApp: boolean;
  isModeValid: boolean;
}

export const SetMode: React.FC<ISetMode> = ({ isSingleApp, isModeValid }) => {
  const { t } = useTranslation();

  const { watch, control } = useFormContext<AnalysisWizardFormValues>();
  const mode = watch("mode");

  const options: SelectOptionProps[] = [
    {
      value: "source-code-deps",
      children: "Source code + dependencies",
    },
    {
      value: "source-code",
      children: "Source code",
    },
    {
      value: "binary",
      children: "Binary",
    },
  ];

  if (isSingleApp) {
    options.push({
      value: "binary-upload",
      children: "Upload a local binary",
    });
  }

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
        forceShowErrors={true}
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
