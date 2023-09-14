import React from "react";
import { Control, FieldValues, Path } from "react-hook-form";
import { HookFormPFGroupController } from "@app/components/HookFormPFFields";
import { Autocomplete } from "@app/components/Autocomplete";

// TODO: Currently only supports working with tag names (which only work if item names are globally unique)
// TODO: Does not support select menu grouping by category
// TODO: Does not support select menu selection checkboxes
// TODO: Does not support rendering item labels with item category color
// TODO: Does not support rendering item labels in item category groups

const ItemsSelect = <
  ItemType extends { name: string },
  FormValues extends FieldValues,
>({
  items = [],
  label,
  fieldId,
  name,
  control,
  noResultsMessage,
  placeholderText,
  searchInputAriaLabel,
  isRequired = false,
}: {
  items: ItemType[];
  name: Path<FormValues>;
  control: Control<FormValues>;
  label: string;
  fieldId: string;
  noResultsMessage: string;
  placeholderText: string;
  searchInputAriaLabel: string;
  isRequired?: boolean;
}) => {
  const itemsToName = () => items.map((item) => item.name).sort();

  const normalizeSelections = (values: string | string[] | undefined) =>
    (Array.isArray(values) ? values : [values]).filter(Boolean) as string[];

  return (
    <HookFormPFGroupController
      isRequired={isRequired}
      control={control}
      name={name}
      label={label}
      fieldId={fieldId}
      renderInput={({ field: { value, onChange } }) => (
        <Autocomplete
          id={fieldId}
          noResultsMessage={noResultsMessage}
          placeholderText={placeholderText}
          searchInputAriaLabel={searchInputAriaLabel}
          options={itemsToName()}
          selections={normalizeSelections(value)}
          onChange={(selection) => {
            onChange(selection as any);
          }}
        />
      )}
    />
  );
};

export default ItemsSelect;
