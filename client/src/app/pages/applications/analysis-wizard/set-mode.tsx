import React from "react";
import { TextContent, Title, Alert, Form } from "@patternfly/react-core";
import { useTranslation } from "react-i18next";

import { OptionWithValue, SimpleSelect } from "@app/shared/components";
import { UploadBinary } from "./components/upload-binary";
import { toOptionLike } from "@app/utils/model-utils";
import { AnalysisMode, AnalysisWizardFormValues } from "./schema";
import { useFormContext } from "react-hook-form";
import { HookFormPFGroupController } from "@app/shared/components/hook-form-pf-fields";

interface ISetMode {
  isSingleApp: boolean;
  taskgroupID: number | null;
  isModeValid: boolean;
}

export const SetMode: React.FC<ISetMode> = ({
  isSingleApp,
  taskgroupID,
  isModeValid,
}) => {
  const { t } = useTranslation();

  const { watch, control, setValue } =
    useFormContext<AnalysisWizardFormValues>();
  const mode = watch("mode");

  const options: OptionWithValue<AnalysisMode>[] = [
    {
      value: "binary",
      toString: () => "Binary",
    },
    {
      value: "source-code",
      toString: () => "Source code",
    },
    {
      value: "source-code-deps",
      toString: () => "Source code + dependencies",
    },
  ];

  if (isSingleApp)
    options.push({
      value: "binary-upload",
      toString: () => "Upload a local binary",
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
        renderInput={({ field: { value, name } }) => (
          <SimpleSelect
            id="analysis-mode"
            toggleId="analysis-mode-toggle"
            toggleAriaLabel="Analysis mode dropdown toggle"
            aria-label={name}
            variant="single"
            value={toOptionLike(value, options)}
            onChange={(selection) => {
              const option = selection as OptionWithValue<AnalysisMode>;
              setValue(name, option.value);
            }}
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
      {mode === "binary-upload" && taskgroupID && (
        <UploadBinary taskgroupID={taskgroupID} />
      )}
    </Form>
  );
};
