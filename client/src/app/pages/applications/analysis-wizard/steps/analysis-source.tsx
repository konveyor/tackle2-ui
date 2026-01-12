import * as React from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Form,
  SelectOptionProps,
  TextContent,
  Title,
} from "@patternfly/react-core";

import { Application, Taskgroup } from "@app/api/models";
import { HookFormPFGroupController } from "@app/components/HookFormPFFields";
import { SimpleSelectBasic } from "@app/components/SimpleSelectBasic";
import { useFormChangeHandler } from "@app/hooks/useFormChangeHandler";

import { UploadApplicationBinary } from "../components/upload-application-binary";
import {
  AnalysisModeState,
  AnalysisModeValues,
  useAnalysisModeSchema,
} from "../schema";
import { isModeSupported } from "../utils";

interface AnalysisSourceProps {
  applications: Application[];
  ensureTaskGroup: () => Promise<Taskgroup>;
  onStateChanged: (state: AnalysisModeState) => void;
  initialState: AnalysisModeState;
}

export const AnalysisSource: React.FC<AnalysisSourceProps> = ({
  applications,
  ensureTaskGroup,
  onStateChanged,
  initialState,
}) => {
  const { t } = useTranslation();

  const schema = useAnalysisModeSchema({
    applications,
    messageNotCompatible:
      "Selected mode is not supported for the selected applications",
  });
  const form = useForm<AnalysisModeValues>({
    defaultValues: {
      mode: initialState.mode,
      artifact: initialState.artifact,
    },
    mode: "all",
    resolver: yupResolver(schema),
  });

  useFormChangeHandler({ form, onStateChanged });

  const [mode, artifact] = useWatch({
    control: form.control,
    name: ["mode", "artifact"],
  });

  const isModeValid = applications.every((app) => isModeSupported(app, mode));
  const isSingleApp = applications.length === 1;

  const analysisOptions: SelectOptionProps[] = [
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
    isSingleApp && {
      value: "binary-upload",
      children: "Upload a local binary",
    },
  ].filter(Boolean);

  return (
    <Form
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      <TextContent>
        <Title headingLevel="h3" size="xl">
          {t("wizard.terms.analysisSource")}
        </Title>
      </TextContent>
      <HookFormPFGroupController
        control={form.control}
        name="mode"
        label={t("wizard.label.analysisSource")}
        fieldId="analysis-source"
        isRequired
        renderInput={({ field: { value, name, onChange } }) => (
          <SimpleSelectBasic
            selectId="analysis-source"
            toggleId="analysis-source-toggle"
            toggleAriaLabel="Analysis source dropdown toggle"
            aria-label={name}
            value={value}
            onChange={onChange}
            options={analysisOptions}
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

      {mode === "binary-upload" && (
        <UploadApplicationBinary
          requestTaskgroupId={async () => (await ensureTaskGroup()).id}
          artifact={artifact}
          onArtifactChange={(artifact) =>
            form.setValue("artifact", artifact, { shouldValidate: true })
          }
        />
      )}
    </Form>
  );
};
