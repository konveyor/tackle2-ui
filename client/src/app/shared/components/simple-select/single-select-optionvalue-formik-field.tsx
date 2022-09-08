import React from "react";
import { FieldHookConfig, useField } from "formik";

import {
  ISimpleSelectProps,
  OptionWithValue,
  SimpleSelect,
} from "./simple-select";

export interface ISingleSelectOptionValueFormikFieldProps<T> {
  fieldConfig: FieldHookConfig<T | null>;
  selectConfig: Omit<
    ISimpleSelectProps,
    "value" | "options" | "onChange" | "onClear"
  >;
  options: T[];
  toOptionWithValue: (option: T) => OptionWithValue<T>;
}

export const SingleSelectOptionValueFormikField = <T extends any>({
  fieldConfig,
  selectConfig,
  options,
  toOptionWithValue,
}: ISingleSelectOptionValueFormikFieldProps<T>) => {
  const [field, , helpers] = useField(fieldConfig);

  return (
    <SimpleSelect
      value={field.value ? toOptionWithValue(field.value) : undefined}
      options={options.map(toOptionWithValue)}
      onChange={(selection) => {
        const selectionValue = (selection as OptionWithValue<T>).value;
        helpers.setValue(selectionValue);
      }}
      onClear={() => helpers.setValue(null)}
      {...selectConfig}
    />
  );
};
