import React from "react";
import { FieldHookConfig, useField } from "formik";

import {
  ISimpleSelectFetchProps,
  SimpleSelectFetch,
} from "./simple-select-fetch";

export interface ISingleSelectFetchFormikFieldProps {
  fieldConfig: FieldHookConfig<any>;
  selectConfig: Omit<ISimpleSelectFetchProps, "value" | "onChange" | "onClear">;
}

export const SingleSelectFetchFormikField: React.FC<
  ISingleSelectFetchFormikFieldProps
> = ({ fieldConfig, selectConfig }) => {
  const [field, , helpers] = useField(fieldConfig);

  return (
    <SimpleSelectFetch
      value={field.value}
      onChange={(selection) => helpers.setValue(selection)}
      onClear={() => helpers.setValue(undefined)}
      {...selectConfig}
    />
  );
};
