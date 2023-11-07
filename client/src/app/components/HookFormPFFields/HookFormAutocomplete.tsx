import React from "react";
import { Control, FieldValues, Path } from "react-hook-form";
import { HookFormPFGroupController } from "@app/components/HookFormPFFields";
import {
  Autocomplete,
  AutocompleteOptionProps,
} from "@app/components/Autocomplete";

// TODO: Does not support select menu grouping by category
// TODO: Does not support select menu selection checkboxes
// TODO: Does not support rendering item labels with item category color
// TODO: Does not support rendering item labels in item category groups

export const HookFormAutocomplete = <FormValues extends FieldValues>({
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
  items: AutocompleteOptionProps[];
  name: Path<FormValues>;
  control: Control<FormValues>;
  label: string;
  fieldId: string;
  noResultsMessage: string;
  placeholderText: string;
  searchInputAriaLabel: string;
  isRequired?: boolean;
}) => (
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
        options={items}
        selections={value}
        onChange={(selection) => {
          onChange(selection);
        }}
      />
    )}
  />
);

export default HookFormAutocomplete;
