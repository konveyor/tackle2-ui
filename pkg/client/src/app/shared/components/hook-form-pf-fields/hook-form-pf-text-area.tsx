import * as React from "react";
import { FieldValues, Path } from "react-hook-form";
import { TextArea, TextAreaProps } from "@patternfly/react-core";
import { getValidatedFromErrorTouched } from "@app/utils/utils";
import {
  HookFormPFGroupController,
  HookFormPFGroupControllerProps,
} from "./hook-form-pf-group-controller";

export interface HookFormPFTextAreaProps<
  TFieldValues extends FieldValues,
  TName extends Path<TFieldValues>
> extends Omit<
    HookFormPFGroupControllerProps<TFieldValues, TName>,
    "renderInput"
  > {
  textAreaProps?: TextAreaProps;
}

export const HookFormPFTextArea = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends Path<TFieldValues> = Path<TFieldValues>
>({
  textAreaProps = {},
  ...controlledGroupProps
}: HookFormPFTextAreaProps<TFieldValues, TName>) => {
  const { fieldId, helperText, isRequired } = controlledGroupProps;
  return (
    <HookFormPFGroupController<TFieldValues, TName>
      {...controlledGroupProps}
      renderInput={({
        field: { onChange, onBlur, value, name, ref },
        fieldState: { isTouched, error },
      }) => (
        <TextArea
          ref={ref}
          name={name}
          id={fieldId}
          aria-describedby={helperText ? `${fieldId}-helper` : undefined}
          isRequired={isRequired}
          onChange={onChange}
          onBlur={onBlur}
          value={value}
          validated={getValidatedFromErrorTouched(error, isTouched)}
          {...textAreaProps}
        />
      )}
    />
  );
};
