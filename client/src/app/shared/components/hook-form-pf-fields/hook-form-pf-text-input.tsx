import * as React from "react";
import { FieldValues, Path } from "react-hook-form";
import { TextInput, TextInputProps } from "@patternfly/react-core";
import { getValidatedFromErrors } from "@app/utils/utils";
import {
  extractGroupControllerProps,
  HookFormPFGroupController,
  BaseHookFormPFGroupControllerProps,
} from "./hook-form-pf-group-controller";

export type HookFormPFTextInputProps<
  TFieldValues extends FieldValues,
  TName extends Path<TFieldValues>
> = TextInputProps & BaseHookFormPFGroupControllerProps<TFieldValues, TName>;

export const HookFormPFTextInput = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends Path<TFieldValues> = Path<TFieldValues>
>(
  props: HookFormPFTextInputProps<TFieldValues, TName>
) => {
  const { extractedProps, remainingProps } = extractGroupControllerProps<
    TFieldValues,
    TName,
    HookFormPFTextInputProps<TFieldValues, TName>
  >(props);
  const { fieldId, helperText, isRequired, errorsSuppressed } = extractedProps;
  const { type } = remainingProps;
  return (
    <HookFormPFGroupController<TFieldValues, TName>
      {...extractedProps}
      renderInput={({
        field: { onChange, onBlur, value, name, ref },
        fieldState: { isDirty, error },
      }) => (
        <TextInput
          ref={ref}
          name={name}
          id={fieldId}
          aria-describedby={helperText ? `${fieldId}-helper` : undefined}
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
          validated={
            errorsSuppressed
              ? "default"
              : getValidatedFromErrors(error, isDirty)
          }
          {...remainingProps}
        />
      )}
    />
  );
};
