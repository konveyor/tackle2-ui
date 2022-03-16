import * as React from "react";
import { UseFormRegister } from "react-hook-form";
import {
  FormGroup,
  Text,
  TextContent,
  Title,
  Select,
  SelectOption,
  SelectVariant,
} from "@patternfly/react-core";
import { useFormContext } from "react-hook-form";

import { IFormValues } from "./analysis-wizard";

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

  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <TextContent>
        <Title headingLevel="h3" size="xl">
          Review analysis details
        </Title>
        <Text>Review the information below, then run the analysis.</Text>
      </TextContent>
      <FormGroup label="Source for analysis" fieldId="sourceType">
        <Select
          {...register("mode")}
          variant={SelectVariant.single}
          aria-label="Select user perspective"
          selections={mode}
          isOpen={isOpen}
          onSelect={(_, selection) => {
            setValue("mode", selection as string);
            setIsOpen(!isOpen);
          }}
          onToggle={() => {
            setIsOpen(!isOpen);
          }}
        >
          {options}
        </Select>
      </FormGroup>
    </>
  );
};
