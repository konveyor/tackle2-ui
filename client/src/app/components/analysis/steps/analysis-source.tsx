import * as React from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import * as yup from "yup";
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
import { isNotEmptyString } from "@app/utils/utils";

// Analysis mode (source)
export const ANALYSIS_MODES = [
  "binary",
  "source-code",
  "source-code-deps",
  "binary-upload",
] as const;

export type AnalysisMode = (typeof ANALYSIS_MODES)[number];

export interface AnalysisModeValues {
  mode: AnalysisMode;
  artifact: File | undefined | null;
}

export interface AnalysisModeState extends AnalysisModeValues {
  isValid: boolean;
}

/**
 * Check if an application supports a given analysis mode
 */
export const isModeSupported = (application: Application, mode?: string) => {
  switch (mode) {
    case "binary-upload":
      return true;

    case "binary":
      return /.+:.+:.+/.test(application?.binary ?? "");

    case "source-code-deps":
      return isNotEmptyString(application?.repository?.url);

    case "source-code":
      return isNotEmptyString(application?.repository?.url);
  }

  return false;
};

/**
 * Filter applications by analysis mode
 */
const filterAnalyzableApplications = (
  applications: Application[],
  mode: AnalysisMode
) => applications.filter((application) => isModeSupported(application, mode));

/**
 * Get analyzable applications grouped by mode
 */
export const useAnalyzableApplicationsByMode = (
  applications: Application[]
): Record<AnalysisMode, Application[]> =>
  React.useMemo(
    () =>
      ANALYSIS_MODES.reduce(
        (record, mode) => ({
          ...record,
          [mode]: filterAnalyzableApplications(applications, mode),
        }),
        {} as Record<AnalysisMode, Application[]>
      ),
    [applications]
  );

export const useAnalysisModeSchema = ({
  applications,
  messageNotCompatible,
}: {
  applications?: Application[];
  messageNotCompatible: string;
}): yup.SchemaOf<AnalysisModeValues> => {
  const { t } = useTranslation();
  const analyzableAppsByMode = useAnalyzableApplicationsByMode(
    applications ?? []
  );

  return yup.object({
    mode: yup
      .mixed<AnalysisMode>()
      .required(t("validation.required"))
      .test("isModeCompatible", messageNotCompatible, (mode) => {
        // When no applications are provided (profile wizard), all modes are valid
        if (!applications || applications.length === 0) {
          return true;
        }

        const analyzableApplications = mode ? analyzableAppsByMode[mode] : [];
        return mode === "binary-upload"
          ? analyzableApplications.length === 1
          : analyzableApplications.length > 0;
      }),
    artifact: yup.mixed<File>().when("mode", {
      is: "binary-upload",
      then: (schema) => schema.required(),
    }),
  });
};

interface AnalysisSourceProps {
  /**
   * Optional applications for context-aware mode validation.
   * When provided (analysis wizard), validates mode compatibility with applications.
   * When omitted (profile wizard), all modes are valid and binary-upload is hidden.
   */
  applications?: Application[];

  /**
   * Optional function to ensure a taskgroup exists for binary upload.
   * Required when binary-upload mode should be available.
   */
  ensureTaskGroup?: () => Promise<Taskgroup>;

  onStateChanged: (state: AnalysisModeState) => void;
  initialState: AnalysisModeState;

  /**
   * Optional render prop for binary upload UI.
   * When provided and mode is "binary-upload", this component is rendered.
   * This allows the parent to inject the binary upload component with taskgroup context.
   */
  renderBinaryUpload?: (props: {
    artifact: File | undefined | null;
    onArtifactChange: (artifact: File | null) => void;
  }) => React.ReactNode;
}

export const AnalysisSource: React.FC<AnalysisSourceProps> = ({
  applications,
  onStateChanged,
  initialState,
  renderBinaryUpload,
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

  // When applications are provided, check mode validity
  const isModeValid =
    !applications ||
    applications.length === 0 ||
    applications.every((app) => isModeSupported(app, mode));

  // Binary upload only available when applications are provided and there's exactly one
  const isSingleApp = applications && applications.length === 1;
  const showBinaryUpload = isSingleApp && !!renderBinaryUpload;

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
    showBinaryUpload && {
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

      {mode === "binary-upload" &&
        renderBinaryUpload &&
        renderBinaryUpload({
          artifact,
          onArtifactChange: (artifact) =>
            form.setValue("artifact", artifact, { shouldValidate: true }),
        })}
    </Form>
  );
};
