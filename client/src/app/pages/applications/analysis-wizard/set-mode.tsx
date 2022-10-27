import React from "react";
import {
  FormGroup,
  TextContent,
  Title,
  SelectVariant,
  Alert,
  Form,
} from "@patternfly/react-core";
import { useTranslation } from "react-i18next";

import { OptionWithValue, SimpleSelect } from "@app/shared/components";
import { UploadBinary } from "./components/upload-binary";
import { toOptionLike } from "@app/utils/model-utils";
import { AnalysisMode } from "./schema";

interface ISetMode {
  mode: string;
  isSingleApp: boolean;
  taskgroupID: number | null;
  isModeValid: boolean;
  setMode: (mode: AnalysisMode) => void;
}

export const SetMode: React.FC<ISetMode> = ({
  mode,
  isSingleApp,
  taskgroupID,
  isModeValid,
  setMode,
}) => {
  const { t } = useTranslation();

  const [isUpload, setIsUpload] = React.useState(false);
  React.useEffect(() => {
    if (mode === "binary-upload") setIsUpload(true);
    else setIsUpload(false);
  }, [mode, isUpload, setIsUpload]);

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
    <Form>
      <TextContent>
        <Title headingLevel="h3" size="xl">
          {t("wizard.terms.analysisMode")}
        </Title>
      </TextContent>
      <FormGroup label={t("wizard.label.analysisSource")} fieldId="sourceType">
        <SimpleSelect
          toggleAriaLabel="analysis-mode-toggle"
          toggleId="analysis-mode-toggle"
          variant={SelectVariant.single}
          aria-label="Select user perspective"
          value={toOptionLike(mode, options)}
          onChange={(selection) => {
            const option = selection as OptionWithValue<AnalysisMode>;
            setMode(option.value);
          }}
          options={options}
        />
      </FormGroup>
      {!isModeValid && (
        <Alert
          variant="warning"
          isInline
          title={t("wizard.label.notAllAnalyzable")}
        >
          <p>{t("wizard.label.notAllAnalyzableDetails")}</p>
        </Alert>
      )}
      {isUpload && taskgroupID && <UploadBinary taskgroupID={taskgroupID} />}
    </Form>
  );
};
