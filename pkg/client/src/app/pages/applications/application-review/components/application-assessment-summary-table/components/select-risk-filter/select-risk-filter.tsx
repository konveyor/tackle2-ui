import React from "react";
import { useTranslation } from "react-i18next";

import { SelectVariant, ToolbarChip } from "@patternfly/react-core";
import { FilterIcon } from "@patternfly/react-icons/dist/esm/icons/filter-icon";

import { OptionWithValue, SimpleSelect } from "@app/shared/components";

import { RISK_LIST, DEFAULT_SELECT_MAX_HEIGHT } from "@app/Constants";
import { Risk } from "@app/api/models";
import { getToolbarChipKey } from "@app/utils/utils";

export interface ISelectRiskFilterProps {
  value?: ToolbarChip[];
  onChange: (values: ToolbarChip[]) => void;
}

export const SelectRiskFilter: React.FC<ISelectRiskFilterProps> = ({
  value = [],
  onChange,
}) => {
  const { t } = useTranslation();

  const riskToToolbarChip = (value: Risk): ToolbarChip => {
    const risk = RISK_LIST[value];
    const label: string = risk ? t(risk.i18Key) : value;

    return {
      key: value,
      node: label,
    };
  };

  const riskToOption = (value: Risk): OptionWithValue<Risk> => {
    const risk = RISK_LIST[value];
    const label = risk ? t(risk.i18Key) : value;

    return {
      value,
      toString: () => label,
      compareTo: (selectOption: any) => {
        // If "string" we are just filtering
        if (typeof selectOption === "string") {
          return label.toLowerCase().includes(selectOption.toLowerCase());
        }
        // If not "string" we are selecting a checkbox
        else {
          return (
            selectOption.value &&
            (selectOption as OptionWithValue<Risk>).value === value
          );
        }
      },
    };
  };

  return (
    <SimpleSelect
      toggleIcon={<FilterIcon />}
      width={220}
      variant={SelectVariant.checkbox}
      aria-label="risk"
      aria-labelledby="risk"
      placeholderText={t("terms.risk")}
      maxHeight={DEFAULT_SELECT_MAX_HEIGHT}
      value={value
        .map((a) => {
          const risks: Risk[] = Object.keys(RISK_LIST) as Risk[];
          return risks.find((b) => getToolbarChipKey(a) === b);
        })
        .filter((f) => f !== undefined)
        .map((f) => riskToOption(f!))}
      options={Object.keys(RISK_LIST).map((k) => riskToOption(k as Risk))}
      onChange={(option) => {
        const optionValue = (option as OptionWithValue<Risk>).value;

        const elementExists = value.some(
          (f) => getToolbarChipKey(f) === optionValue
        );
        let newIds: ToolbarChip[];
        if (elementExists) {
          newIds = value.filter((f) => getToolbarChipKey(f) !== optionValue);
        } else {
          newIds = [...value, riskToToolbarChip(optionValue)];
        }

        onChange(newIds);
      }}
      hasInlineFilter
      onClear={() => onChange([])}
    />
  );
};
