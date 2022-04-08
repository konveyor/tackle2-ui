import * as React from "react";
import {
  FormGroup,
  TextContent,
  Title,
  SelectOption,
  SelectVariant,
  Alert,
} from "@patternfly/react-core";
import { useFormContext } from "react-hook-form";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import { SimpleSelect } from "@app/shared/components";
import { UploadBinary } from "./components/upload-binary";

interface ISetMode {
  isSingleApp: boolean;
  taskgroupID: number | null;
  isModeValid: boolean;
}

export const SetMode: React.FunctionComponent<ISetMode> = ({
  isSingleApp,
  taskgroupID,
  isModeValid,
}) => {
  const { getValues, setValue } = useFormContext();

  const { mode } = getValues();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isUpload, setIsUpload] = React.useState(false);

  const options = [
    <SelectOption
      key="binary"
      component="button"
      value="Binary"
      isPlaceholder
    />,
    <SelectOption key="source-code" component="button" value="Source code" />,
    <SelectOption
      key="source-code-deps"
      component="button"
      value="Source code + dependencies"
    />,
  ];

  if (isSingleApp && taskgroupID)
    options.push(
      <SelectOption
        key="binary-upload"
        component="button"
        value="Upload a local binary"
      />
    );

  return (
    <>
      <TextContent className={spacing.mbMd}>
        <Title headingLevel="h3" size="xl">
          Analysis mode
        </Title>
      </TextContent>
      <FormGroup label="Source for analysis" fieldId="sourceType">
        <SimpleSelect
          variant={SelectVariant.single}
          aria-label="Select user perspective"
          value={mode}
          onChange={(selection) => {
            setValue("mode", selection);
            if (selection === "Upload a local binary") setIsUpload(true);
            else setIsUpload(false);
            setIsOpen(!isOpen);
          }}
          options={options}
        />
      </FormGroup>
      {!isModeValid && (
        <Alert
          variant="warning"
          isInline
          title="Some applications cannot be analyzed"
        >
          <p>
            Some of the selected applications cannot be analyzed with the
            selected source because those values have not been defined. By
            continuing, these applications won't be included in the analysis.
          </p>
        </Alert>
      )}
      {isUpload && taskgroupID && <UploadBinary taskgroupID={taskgroupID} />}
    </>
  );
};
