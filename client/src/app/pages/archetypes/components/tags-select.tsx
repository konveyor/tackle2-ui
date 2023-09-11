import React from "react";
import { Control, Path } from "react-hook-form";
import type { Tag } from "@app/api/models";
import { HookFormPFGroupController } from "@app/components/HookFormPFFields";
import { Autocomplete } from "@app/components/Autocomplete";
import type { ArchetypeFormValues } from "./archetype-form";

// TODO: Currently only supports working with tag names (which only work if tags names are globally unique)
// TODO: Does not support select menu grouping by tag category
// TODO: Does not support select menu selection checkboxes
// TODO: Does not support rendering tag labels with tag category color
// TODO: Does not support rendering tag labels in tag category groups
const TagsSelect = ({
  tags,
  control,
  name,
  label,
  fieldId,
  noResultsMessage,
  placeholderText,
  searchInputAriaLabel,
  isRequired = false,
}: {
  tags: Tag[];
  control: Control<ArchetypeFormValues>;
  name: Path<ArchetypeFormValues>;
  label: string;
  fieldId: string;
  noResultsMessage: string;
  placeholderText: string;
  searchInputAriaLabel: string;
  isRequired: boolean;
}) => {
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
          options={tags.map((tag) => tag.name).sort()}
          selections={Array.isArray(value) ? value : [value]}
          onChange={onChange}
        />
      )}
    />
  );
};

export default TagsSelect;
