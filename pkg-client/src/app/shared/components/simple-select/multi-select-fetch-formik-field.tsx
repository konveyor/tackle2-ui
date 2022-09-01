import React from "react";
import { FieldHookConfig, useField } from "formik";

import {
  ISimpleSelectFetchProps,
  SimpleSelectFetch,
} from "./simple-select-fetch";

export interface IMultiSelectFetchFormikFieldProps {
  fieldConfig: FieldHookConfig<any>;
  selectConfig: Omit<ISimpleSelectFetchProps, "value" | "onChange" | "onClear">;
  isEqual: (a: any, b: any) => boolean;
}

export const MultiSelectFetchFormikField: React.FC<
  IMultiSelectFetchFormikFieldProps
> = ({ fieldConfig, selectConfig, isEqual }) => {
  const [field, , helpers] = useField(fieldConfig);

  return (
    <SimpleSelectFetch
      value={field.value}
      onChange={(selection) => {
        const currentValue = field.value || [];

        let nextValue: any[];
        const elementExists = currentValue.find((f: any) => {
          return isEqual(f, selection);
        });

        if (elementExists) {
          nextValue = currentValue.filter((f: any) => !isEqual(f, selection));
        } else {
          nextValue = [...currentValue, selection];
        }

        helpers.setValue(nextValue);
      }}
      onClear={() => helpers.setValue(undefined)}
      {...selectConfig}
    />
  );
};
