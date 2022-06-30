import React from "react";
import {
  FormGroup,
  TextContent,
  Title,
  SelectVariant,
  Alert,
} from "@patternfly/react-core";
import { useTranslation } from "react-i18next";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import { OptionWithValue, SimpleSelect } from "@app/shared/components";
import { UploadBinary } from "./components/upload-binary";
import { toOptionLike } from "@app/utils/model-utils";

interface ISetMode {
  mode: string;
  isSingleApp: boolean;
  taskgroupID: number | null;
  isModeValid: boolean;
  setMode: (mode: string) => void;
}

export const SetMode: React.FunctionComponent<ISetMode> = ({
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

  const options = [
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
    <>
      <TextContent className={spacing.mbMd}>
        <Title headingLevel="h3" size="xl">
          {t("wizard.terms.analysisMode")}
        </Title>
      </TextContent>
      <FormGroup label={t("wizard.label.analysisSource")} fieldId="sourceType">
        <SimpleSelect
          variant={SelectVariant.single}
          aria-label="Select user perspective"
          value={toOptionLike(mode, options)}
          onChange={(selection) => {
            const option = selection as OptionWithValue<string>;
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
    </>
  );
};
