import * as React from "react";
import { FormGroup, FormGroupProps } from "@patternfly/react-core";
import {
  Control,
  Controller,
  ControllerProps,
  FieldValues,
  Path,
} from "react-hook-form";
import { getValidatedFromErrorTouched } from "@app/utils/utils";

// Generic type params here are the same as the ones used by react-hook-form's <Controller>
export interface HookFormPFGroupControllerProps<
  TFieldValues extends FieldValues,
  TName extends Path<TFieldValues>
> {
  control: Control<TFieldValues>;
  label: string;
  name: TName;
  fieldId: string;
  isRequired?: boolean;
  helperText?: React.ReactNode;
  className?: string;
  formGroupProps?: FormGroupProps;
  renderInput: ControllerProps<TFieldValues, TName>["render"];
}

export const HookFormPFGroupController = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends Path<TFieldValues> = Path<TFieldValues>
>({
  control,
  label,
  name,
  fieldId,
  isRequired = false,
  helperText,
  className,
  formGroupProps = {},
  renderInput,
}: HookFormPFGroupControllerProps<TFieldValues, TName>) => (
  <Controller<TFieldValues, TName>
    control={control}
    name={name}
    render={({ field, fieldState, formState }) => {
      const { isTouched, error } = fieldState;
      return (
        <FormGroup
          label={label}
          fieldId={fieldId}
          className={className}
          isRequired={isRequired}
          validated={getValidatedFromErrorTouched(error, isTouched)}
          helperText={helperText}
          helperTextInvalid={error?.message}
          {...formGroupProps}
        >
          {renderInput({ field, fieldState, formState })}
        </FormGroup>
      );
    }}
  />
);
