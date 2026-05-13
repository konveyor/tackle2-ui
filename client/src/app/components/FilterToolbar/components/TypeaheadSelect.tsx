import { FC } from "react";

import { MultiSelect, MultiSelectProps } from "./MultiSelect";

export type TypeaheadSelectProps = Omit<
  MultiSelectProps,
  "values" | "onSelect" | "variant" | "onClear"
> & {
  value?: string;
  onSelect: (value?: string) => void;
};

const TypeaheadSelect: FC<TypeaheadSelectProps> = ({ value, ...props }) => (
  <MultiSelect
    {...props}
    hasCheckbox={false}
    values={value ? [value] : []}
    onSelect={props.onSelect}
    showSelectedInToggle={true}
    hasBadge={false}
    closeMenuOnSelect={true}
    onClear={() => props.onSelect(undefined)}
  />
);

export default TypeaheadSelect;
