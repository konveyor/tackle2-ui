import * as React from "react";
import {
  FormGroup,
  Select,
  SelectOption,
  SelectVariant,
} from "@patternfly/react-core";
import { useTranslation } from "react-i18next";
import { IFormValues } from "./analysis-wizard";
import { FormState, UseFormRegister, UseFormSetValue } from "react-hook-form";
const options = [
  <SelectOption
    key="binary"
    component="button"
    // onClick={}
    value="Binary"
    isPlaceholder
  />,
  <SelectOption
    key="source-code"
    component="button"
    // onClick={}
    value="Source code"
  />,
  <SelectOption
    key="source-code-deps"
    component="button"
    // onClick={}
    value="Source code + dependencies"
  />,
];

interface IAnalysisMode {
  register: UseFormRegister<IFormValues>;
  setValue: UseFormSetValue<IFormValues>;
  formState: FormState<IFormValues>;
}

export const AnalysisMode: React.FunctionComponent<IAnalysisMode> = ({
  register,
  setValue,
  formState,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selected, setSelected] = React.useState("");

  return (
    <>
      <FormGroup
        label="Source for analysis" //{t("terms.sources")}
        fieldId="sourceType"
        isRequired={true}
        // validated={getValidatedFromError(formik.errors.jobFunction)}
        // helperTextInvalid={formik.errors.jobFunction}
      >
        <Select
          {...register("mode")}
          variant={SelectVariant.single}
          aria-label="Select user perspective"
          selections={selected}
          isOpen={isOpen}
          onSelect={(_, selection) => {
            setSelected(selection as string);
            setValue("mode", selection as string);
            setIsOpen(!isOpen);
          }}
          onToggle={() => {
            setIsOpen(!isOpen);
          }}
        >
          {options}
        </Select>
        <p>{formState.errors.mode?.message}</p>
      </FormGroup>
    </>
  );
};
