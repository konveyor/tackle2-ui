import { FC } from "react";

import { MultiSelectBase, MultiSelectProps } from "./MultiSelectBase";

export type TypeaheadSelectProps = Omit<MultiSelectProps, "values"> & {
  value?: string;
  onSelect: (value: string) => void;
};

const TypeaheadSelect: FC<TypeaheadSelectProps> = ({ value, ...props }) => (
  <MultiSelectBase {...props} values={value ? [value] : []} />
);

export default TypeaheadSelect;
