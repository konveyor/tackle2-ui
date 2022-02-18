import React from "react";
import { FieldHookConfig, useField } from "formik";

import {
  ISimpleSelectFetchProps,
  SimpleSelectFetch,
} from "./simple-select-fetch";
import { OptionWithValue } from "./simple-select";

export interface IMultiSelectFetchOptionValueFormikFieldProps<T> {
  fieldConfig: FieldHookConfig<T[]>;
  selectConfig: Omit<
    ISimpleSelectFetchProps,
    "value" | "options" | "onChange" | "onClear"
  >;
  options: T[];
  toOptionWithValue: (option: T) => OptionWithValue<T>;
  isEqual: (a: T, b: T) => boolean;
}

export const MultiSelectFetchOptionValueFormikField = <T extends any>({
  fieldConfig,
  selectConfig,
  options,
  toOptionWithValue,
  isEqual,
}: IMultiSelectFetchOptionValueFormikFieldProps<T>) => {
  const [field, , helpers] = useField(fieldConfig);

  return (
    <SimpleSelectFetch
      value={field.value.map(toOptionWithValue)}
      options={options.map(toOptionWithValue)}
      onChange={(selection) => {
        const selectionValue = (selection as OptionWithValue<T>).value;

        const currentValue = field.value;

        let nextValue: T[];
        const elementExists = currentValue.find((f: T) => {
          return isEqual(f, selectionValue);
        });

        if (elementExists) {
          nextValue = currentValue.filter(
            (f: T) => !isEqual(f, selectionValue)
          );
        } else {
          nextValue = [...currentValue, selectionValue];
        }

        helpers.setValue(nextValue);
      }}
      onClear={() => helpers.setValue([])}
      {...selectConfig}
    />
  );
};
