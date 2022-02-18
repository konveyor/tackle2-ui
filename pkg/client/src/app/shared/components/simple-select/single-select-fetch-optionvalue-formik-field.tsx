import React from "react";
import { FieldHookConfig, useField } from "formik";

import {
  ISimpleSelectFetchProps,
  SimpleSelectFetch,
} from "./simple-select-fetch";
import { OptionWithValue } from "./simple-select";

export interface ISingleSelectFetchOptionValueFormikFieldProps<T> {
  fieldConfig: FieldHookConfig<T | null>;
  selectConfig: Omit<
    ISimpleSelectFetchProps,
    "value" | "options" | "onChange" | "onClear"
  >;
  options: T[];
  toOptionWithValue: (option: T) => OptionWithValue<T>;
}

export const SingleSelectFetchOptionValueFormikField = <T extends any>({
  fieldConfig,
  selectConfig,
  options,
  toOptionWithValue,
}: ISingleSelectFetchOptionValueFormikFieldProps<T>) => {
  const [field, , helpers] = useField(fieldConfig);

  return (
    <SimpleSelectFetch
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
