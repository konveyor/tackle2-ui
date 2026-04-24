import { FC } from "react";

import { MultiSelectBase, MultiSelectProps } from "./MultiSelectBase";

export type TypeaheadSelectProps = Omit<
  MultiSelectProps,
  "values" | "onSelect" | "variant"
> & {
  value?: string;
  onSelect: (value?: string) => void;
};

const TypeaheadSelect: FC<TypeaheadSelectProps> = ({ value, ...props }) => (
  <MultiSelectBase
    {...props}
    hasCheckbox={false}
    values={value ? [value] : []}
    onSelect={props.onSelect}
    showSelectedInToggle={true}
    hasBadge={false}
    closeMenuOnSelect={true}
  />
);

export default TypeaheadSelect;
