import * as React from "react";
import {
  FormGroup,
  TextContent,
  Title,
  SelectOption,
  SelectVariant,
} from "@patternfly/react-core";
import { useFormContext } from "react-hook-form";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import { SimpleSelect } from "@app/shared/components";
import { UploadBinary } from "./components/upload-binary";

interface ISetMode {
  isSingleApp: boolean;
}

export const SetMode: React.FunctionComponent<ISetMode> = ({ isSingleApp }) => {
  const { register, getValues, setValue } = useFormContext();
  const mode: string = getValues("mode");

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

  if (isSingleApp)
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
          {...register("mode")}
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
      {isUpload && <UploadBinary />}
    </>
  );
};
