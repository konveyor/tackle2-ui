import * as React from "react";
import {
  Badge,
  MenuToggle,
  MenuToggleElement,
  Select,
  SelectList,
  SelectOption,
  SelectOptionProps,
} from "@patternfly/react-core";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

export interface ISimpleSelectBasicProps {
  onChange: (selection: string[]) => void;
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
  const [selectOptions, setSelectOptions] = React.useState<SelectOptionProps[]>(
    [{ value: "show-all", label: "Show All", children: "Show All" }, ...options]
  );

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
    if (!value || !selectionValue) {
      return;
    }
    let newValue: string[] = [];
    if (selectionValue === "show-all") {
      newValue =
        value.length === options.length ? [] : options.map((opt) => opt.value);
    } else {
      if (value.includes(selectionValue as string)) {
        newValue = value.filter((item) => item !== selectionValue);
      } else {
        newValue = [...value, selectionValue as string];
      }
    }
    onChange(newValue);
  };

  return (
    <Select
      role="menu"
      id={id}
      isOpen={isOpen}
      selected={value}
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
          {value && value.length > 0 && <Badge isRead>{value.length}</Badge>}
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
            onClick={(e) => {
              onSelect(e, option.value);
            }}
            isSelected={
              option.value === "show-all"
                ? value?.length === options.length
                : value?.includes(option.value as string)
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
