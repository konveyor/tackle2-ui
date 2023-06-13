import * as React from "react";
import { FormGroup, FormGroupProps } from "@patternfly/react-core";
import {
  Control,
  Controller,
  ControllerProps,
  FieldValues,
  Path,
} from "react-hook-form";
import { getValidatedFromErrors } from "@app/utils/utils";

// We have separate interfaces for these props with and without `renderInput` for convenience.
// Generic type params here are the same as the ones used by react-hook-form's <Controller>.
export interface BaseHookFormPFGroupControllerProps<
  TFieldValues extends FieldValues,
  TName extends Path<TFieldValues>
> {
  control: Control<TFieldValues>;
  label?: React.ReactNode;
  labelIcon?: React.ReactElement;
  name: TName;
  fieldId: string;
  isRequired?: boolean;
  errorsSuppressed?: boolean;
  helperText?: React.ReactNode;
  className?: string;
  formGroupProps?: FormGroupProps;
}

export interface HookFormPFGroupControllerProps<
  TFieldValues extends FieldValues,
  TName extends Path<TFieldValues>
> extends BaseHookFormPFGroupControllerProps<TFieldValues, TName> {
  renderInput: ControllerProps<TFieldValues, TName>["render"];
}

export const HookFormPFGroupController = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends Path<TFieldValues> = Path<TFieldValues>
>({
  control,
  label,
  labelIcon,
  name,
  fieldId,
  isRequired = false,
  errorsSuppressed = false,
  helperText,
  className,
  formGroupProps = {},
  renderInput,
}: HookFormPFGroupControllerProps<TFieldValues, TName>) => (
  <Controller<TFieldValues, TName>
    control={control}
    name={name}
    render={({ field, fieldState, formState }) => {
      const { isDirty, error } = fieldState;
      return (
        <FormGroup
          labelIcon={labelIcon}
          label={label}
          fieldId={fieldId}
          className={className}
          isRequired={isRequired}
          onBlur={field.onBlur}
          validated={
            errorsSuppressed
              ? "default"
              : getValidatedFromErrors(error, isDirty)
          }
          helperText={helperText}
          helperTextInvalid={errorsSuppressed ? null : error?.message}
          {...formGroupProps}
        >
          {renderInput({ field, fieldState, formState })}
        </FormGroup>
      );
    }}
  />
);

// Utility for pulling props needed by this component and passing the rest to a rendered input
export const extractGroupControllerProps = <
  TFieldValues extends FieldValues,
  TName extends Path<TFieldValues>,
  TProps extends BaseHookFormPFGroupControllerProps<TFieldValues, TName>
>(
  props: TProps
): {
  extractedProps: BaseHookFormPFGroupControllerProps<TFieldValues, TName>;
  remainingProps: Omit<
    TProps,
    keyof BaseHookFormPFGroupControllerProps<TFieldValues, TName>
  >;
} => {
  const {
    control,
    label,
    labelIcon,
    name,
    fieldId,
    isRequired,
    errorsSuppressed,
    helperText,
    className,
    formGroupProps,
    ...remainingProps
  } = props;
  return {
    extractedProps: {
      control,
      labelIcon,
      label,
      name,
      fieldId,
      isRequired,
      errorsSuppressed,
      helperText,
      className,
      formGroupProps,
    },
    remainingProps,
  };
};
