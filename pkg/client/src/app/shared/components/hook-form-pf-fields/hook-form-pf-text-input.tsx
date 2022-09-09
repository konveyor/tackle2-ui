import * as React from "react";
import { FieldValues, Path } from "react-hook-form";
import { TextInput, TextInputProps } from "@patternfly/react-core";
import { getValidatedFromErrorTouched } from "@app/utils/utils";
import {
  HookFormPFGroupController,
  HookFormPFGroupControllerProps,
} from "./hook-form-pf-group-controller";

export interface HookFormPFTextInputProps<
  TFieldValues extends FieldValues,
  TName extends Path<TFieldValues>
> extends Omit<
    HookFormPFGroupControllerProps<TFieldValues, TName>,
    "renderInput"
  > {
  inputProps?: TextInputProps;
}

export const HookFormPFTextInput = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends Path<TFieldValues> = Path<TFieldValues>
>({
  inputProps = { type: "text" },
  ...controlledGroupProps
}: HookFormPFTextInputProps<TFieldValues, TName>) => {
  const { fieldId, helperText, isRequired } = controlledGroupProps;
  return (
    <HookFormPFGroupController<TFieldValues, TName>
      {...controlledGroupProps}
      renderInput={({
        field: { onChange, onBlur, value, name, ref },
        fieldState: { isTouched, error },
      }) => (
        <TextInput
          ref={ref}
          name={name}
          id={fieldId}
          aria-describedby={helperText ? `${fieldId}-helper` : undefined}
          isRequired={isRequired}
          onChange={(value) => {
            if (inputProps.type === "number") {
              onChange((value && parseInt(value, 10)) || "");
            } else {
              onChange(value);
            }
          }}
          onBlur={onBlur}
          value={value}
          validated={getValidatedFromErrorTouched(error, isTouched)}
          {...inputProps}
        />
      )}
    />
  );
};
