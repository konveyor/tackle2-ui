import React from "react";
import { Control, Path } from "react-hook-form";
import { HookFormPFGroupController } from "@app/components/HookFormPFFields";
import { Autocomplete } from "@app/components/Autocomplete";
import type { ArchetypeFormValues } from "./archetype-form";

// TODO: Currently only supports working with tag names (which only work if item names are globally unique)
// TODO: Does not support select menu grouping by category
// TODO: Does not support select menu selection checkboxes
// TODO: Does not support rendering item labels with item category color
// TODO: Does not support rendering item labels in item category groups
const ItemsSelect = <ItemType extends { name: string }>({
  items = [],
  control,
  name,
  label,
  fieldId,
  noResultsMessage,
  placeholderText,
  searchInputAriaLabel,
  isRequired = false,
}: {
  items: ItemType[];
  control: Control<ArchetypeFormValues>;
  name: Path<ArchetypeFormValues>;
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
          onChange={onChange}
        />
      )}
    />
  );
};

export default ItemsSelect;
