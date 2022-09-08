import * as React from "react";
import {
  FormGroup,
  FormGroupProps,
  TextInput,
  TextInputProps,
} from "@patternfly/react-core";
import { Control, Controller, FieldValues, Path } from "react-hook-form";

export interface HookFormTextFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends Path<TFieldValues> = Path<TFieldValues>
> extends TextInputProps {
  control: Control<TFieldValues>;
  name: TName;
  id: string;
  label: string;
  className?: string;
  isRequired?: boolean;
  helperText?: React.ReactNode;
  formGroupProps?: FormGroupProps;
}

// Generic type params here are the same as the ones used by react-hook-form's <Controller>
export const HookFormTextField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends Path<TFieldValues> = Path<TFieldValues>
>({
  control,
  name,
  id,
  label,
  isRequired = false,
  helperText,
  className,
  type = "text",
  formGroupProps = {},
  ...props
}: React.PropsWithChildren<HookFormTextFieldProps<TFieldValues, TName>>) => (
  <Controller<TFieldValues, TName>
    control={control}
    name={name}
    render={({
      field: { onChange, onBlur, value, ref },
      fieldState: { isTouched, error },
    }) => {
      const validated: FormGroupProps["validated"] =
        error && isTouched ? "error" : "default";
      return (
        <FormGroup
          label={label}
          fieldId={id}
          className={className}
          isRequired={isRequired}
          validated={validated}
          helperText={helperText}
          helperTextInvalid={error?.message}
          {...formGroupProps}
        >
          <TextInput
            ref={ref}
            name={name}
            id={id}
            aria-describedby={helperText ? `${id}-helper` : undefined}
            isRequired={isRequired}
            onChange={(value) => {
              if (type === "number") {
                onChange((value && parseInt(value, 10)) || "");
              } else {
                onChange(value);
              }
            }}
            onBlur={onBlur}
            value={value}
            validated={validated}
            {...props}
          />
        </FormGroup>
      );
    }}
  />
);
