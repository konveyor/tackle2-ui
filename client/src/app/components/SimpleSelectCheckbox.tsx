import React from "react";
import {
  Select,
  SelectOption,
  SelectList,
  MenuToggle,
  Badge,
  SelectOptionProps,
  MenuToggleElement,
} from "@patternfly/react-core";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

export interface ISimpleSelectBasicProps {
  onChange: (selection: string | string[]) => void;
  options: SelectOptionProps[];
  value?: string[];
  placeholderText?: string;
  id?: string;
  toggleId?: string;
  toggleAriaLabel?: string;
  selectMultiple?: boolean;
  width?: number;
  noResultsFoundText?: string;
  hideClearButton?: false;
}

export const SimpleSelectCheckbox: React.FC<ISimpleSelectBasicProps> = ({
  onChange,
  options,
  value,
  placeholderText = "Select...",
  id,
  toggleId,
  toggleAriaLabel,
  width,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedItems, setSelectedItems] = React.useState<string[]>([]);
  const [selectOptions, setSelectOptions] = React.useState<SelectOptionProps[]>(
    [{ value: "show-all", label: "Show All", children: "Show All" }, ...options]
  );

  React.useEffect(() => {
    setSelectedItems(value || []);
  }, [value]);

  React.useEffect(() => {
    const updatedOptions = [
      { value: "show-all", label: "Show All", children: "Show All" },
      ...options,
    ];
    setSelectOptions(updatedOptions);
  }, [options]);

  const onToggleClick = () => {
    setIsOpen(!isOpen);
  };

  const onSelect = (
    _event: React.MouseEvent<Element, MouseEvent> | undefined,
    selectionValue: string | number | undefined
  ) => {
    const value = selectionValue as string;
    if (value === "show-all") {
      if (selectedItems.length === options.length) {
        setSelectedItems([]);
        onChange([]);
      } else {
        const allItemValues = options.map((option) => option.value as string);
        setSelectedItems(allItemValues);
        onChange(allItemValues);
      }
    } else {
      if (selectedItems.includes(value)) {
        const newSelections = selectedItems.filter((item) => item !== value);
        setSelectedItems(newSelections);
        onChange(newSelections);
      } else {
        const newSelections = [...selectedItems, value];
        setSelectedItems(newSelections);
        onChange(newSelections);
      }
    }
  };

  return (
    <Select
      role="menu"
      id={id}
      isOpen={isOpen}
      selected={selectedItems}
      onSelect={onSelect}
      onOpenChange={setIsOpen}
      toggle={(toggleref: React.Ref<MenuToggleElement>) => (
        <MenuToggle
          aria-label={toggleAriaLabel}
          id={toggleId}
          ref={toggleref}
          onClick={onToggleClick}
          style={{ width: width && width + "px" }}
          isExpanded={isOpen}
        >
          <span className={spacing.mrSm}>{placeholderText}</span>
          {selectedItems.length > 0 && (
            <Badge isRead>{selectedItems.length}</Badge>
          )}
        </MenuToggle>
      )}
      aria-label={toggleAriaLabel}
    >
      <SelectList>
        {selectOptions.map((option, index) => (
          <SelectOption
            id={`checkbox-for-${option.value}`}
            hasCheckbox
            key={option.value}
            isFocused={index === 0}
            onClick={() => onSelect(undefined, option.value)}
            isSelected={
              option.value === "show-all"
                ? selectedItems.length === options.length
                : selectedItems.includes(option.value as string)
            }
            {...option}
          >
            {option.children || option.value}
          </SelectOption>
        ))}
      </SelectList>
    </Select>
  );
};
