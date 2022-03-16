import * as React from "react";
import { UseFormRegister } from "react-hook-form";
import {
  FormGroup,
  Text,
  TextContent,
  Title,
  SelectOption,
  SelectVariant,
} from "@patternfly/react-core";
import { useFormContext } from "react-hook-form";

import { SimpleSelect } from "@app/shared/components";

const options = [
  <SelectOption key="binary" component="button" value="Binary" isPlaceholder />,
  <SelectOption key="source-code" component="button" value="Source code" />,
  <SelectOption
    key="source-code-deps"
    component="button"
    value="Source code + dependencies"
  />,
];

export const SetMode: React.FunctionComponent = () => {
  const { register, getValues, setValue } = useFormContext();
  const mode: string = getValues("mode");

  return (
    <>
      <TextContent>
        <Title headingLevel="h3" size="xl">
          Review analysis details
        </Title>
        <Text>Review the information below, then run the analysis.</Text>
      </TextContent>
      <FormGroup label="Source for analysis" fieldId="sourceType">
        <SimpleSelect
          {...register("mode")}
          variant={SelectVariant.single}
          aria-label="Select user perspective"
          value={mode}
          onChange={(selection) => {
            setValue("mode", selection as string);
          }}
          options={options}
        />
      </FormGroup>
    </>
  );
};
