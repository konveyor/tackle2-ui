import * as React from "react";
import { FormGroup } from "@patternfly/react-core";
import {
  UseFormGetValues,
  UseFormRegister,
  UseFormSetValue,
} from "react-hook-form";

import { Select, SelectOption, SelectVariant } from "@patternfly/react-core";

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

interface IAnalysisMode {
  register: UseFormRegister<IFormValues>;
  getValues: UseFormGetValues<IFormValues>;
  setValue: UseFormSetValue<IFormValues>;
}

export const AnalysisMode: React.FunctionComponent<IAnalysisMode> = ({
  register,
  getValues,
  setValue,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <FormGroup label="Source for analysis" fieldId="sourceType">
        <Select
          {...register("mode")}
          variant={SelectVariant.single}
          aria-label="Select user perspective"
          selections={getValues("mode")}
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
