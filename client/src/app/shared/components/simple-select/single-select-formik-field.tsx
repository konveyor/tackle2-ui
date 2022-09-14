import React from "react";
import { FieldHookConfig, useField } from "formik";

import { ISimpleSelectProps, SimpleSelect } from "./simple-select";

export interface ISingleSelectFormikFieldProps {
  fieldConfig: FieldHookConfig<any>;
  selectConfig: Omit<ISimpleSelectProps, "value" | "onChange" | "onClear">;
}

export const SingleSelectFormikField: React.FC<
  ISingleSelectFormikFieldProps
> = ({ fieldConfig, selectConfig }) => {
  const [field, , helpers] = useField(fieldConfig);

  return (
    <SimpleSelect
      value={field.value}
      onChange={(selection) => helpers.setValue(selection)}
      onClear={() => helpers.setValue(undefined)}
      {...selectConfig}
    />
  );
};
