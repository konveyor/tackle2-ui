import React from "react";
import { FieldHookConfig, useField } from "formik";

import {
  OptionWithValue,
  ISimpleSelectFetchProps,
  SimpleSelectFetch,
} from "@app/shared/components";
import { StakeholderGroup } from "@app/api/models";

const stakeholderGroupToOption = (
  value: StakeholderGroup
): OptionWithValue<StakeholderGroup> => ({
  value,
  toString: () => value.name,
});

export interface IStakeholderGroupSelectProps {
  fieldConfig: FieldHookConfig<number[]>;
  selectConfig: Omit<
    ISimpleSelectFetchProps,
    "value" | "onChange" | "onClear" | "options"
  >;
  stakeholderGroups: StakeholderGroup[];
}

export const StakeholderGroupSelect: React.FC<IStakeholderGroupSelectProps> = ({
  fieldConfig,
  selectConfig,
  stakeholderGroups,
}) => {
  const [field, , helpers] = useField(fieldConfig);

  return (
    <SimpleSelectFetch
      value={field.value
        .map((id) => stakeholderGroups.find((f) => id === f.id))
        .map((e) => (e ? stakeholderGroupToOption(e) : undefined))
        .filter((e) => e !== undefined)}
      options={stakeholderGroups.map(stakeholderGroupToOption)}
      onChange={(selection) => {
        const selectionWithValue =
          selection as OptionWithValue<StakeholderGroup>;
        const selectionId: number = selectionWithValue.value.id!;

        const currentValue = field.value || [];
        const e = currentValue.find((f) => f === selectionId);
        if (e) {
          helpers.setValue(currentValue.filter((f) => f !== selectionId));
        } else {
          helpers.setValue([...currentValue, selectionId]);
        }
      }}
      onClear={() => helpers.setValue([])}
      {...selectConfig}
    />
  );
};
