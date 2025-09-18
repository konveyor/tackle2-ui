import React from "react";
import {
  Button,
  Chip,
  ChipGroup,
  MenuToggle,
  MenuToggleElement,
  Select,
  SelectList,
  SelectOption,
  SelectOptionProps,
  TextInputGroup,
  TextInputGroupMain,
  TextInputGroupUtilities,
} from "@patternfly/react-core";
import TimesIcon from "@patternfly/react-icons/dist/esm/icons/times-icon";

export interface ISimpleSelectBasicProps {
  onChange: (selection: string | string[]) => void;
  options: SelectOptionProps[];
  value?: string;
  placeholderText?: string;
  id?: string;
  toggleId?: string;
  toggleAriaLabel?: string;
  selectMultiple?: boolean;
  width?: number;
  noResultsFoundText?: string;
  hideClearButton?: boolean;
}

export const SimpleSelectTypeahead: React.FC<ISimpleSelectBasicProps> = ({
  onChange,
  options,
  value,
  placeholderText = "Select...",
  id,
  toggleId,
  toggleAriaLabel,
  selectMultiple = false,
  width,
  noResultsFoundText,
  hideClearButton = false,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<string | string[]>(
    selectMultiple ? [] : ""
  );
  const [inputValue, setInputValue] = React.useState<string>(value || "");
  const [filterValue, setFilterValue] = React.useState<string>("");
  const [selectOptions, setSelectOptions] =
    React.useState<SelectOptionProps[]>(options);
  const [focusedItemIndex, setFocusedItemIndex] = React.useState<number | null>(
    null
  );
  const [activeItem, setActiveItem] = React.useState<string | null>(null);
  const textInputRef = React.useRef<HTMLInputElement>();
  React.useEffect(() => {
    let newSelectOptions: SelectOptionProps[] = options;

    // Filter menu items based on the text input value when one exists
    if (filterValue) {
      newSelectOptions = options.filter((menuItem) =>
        String(menuItem.value).toLowerCase().includes(filterValue.toLowerCase())
      );

      // When no options are found after filtering, display 'No results found'
      if (!newSelectOptions.length) {
        newSelectOptions = [
          {
            isDisabled: true,
            children:
              noResultsFoundText || `No results found for "${filterValue}"`,
            value: "no results",
          },
        ];
      }

      // Open the menu when the input value changes and the new value is not empty
      if (!isOpen) {
        setIsOpen(true);
      }
    }

    setSelectOptions(newSelectOptions);
    setActiveItem(null);
    setFocusedItemIndex(null);
  }, [filterValue, options]);

  const onToggleClick = () => {
    setIsOpen(!isOpen);
  };

  const onSelect = (
    _event: React.MouseEvent<Element, MouseEvent> | undefined,
    value: string | number | undefined
  ) => {
    value = value as string;
    if (value && value !== "no results") {
      if (selectMultiple) {
        const selections = Array.isArray(selected) ? selected : [selected];
        const newSelections = selections.includes(value)
          ? selections.filter((sel) => sel !== value)
          : [...selections, value];
        setSelected(newSelections);
        onChange(newSelections);
      } else {
        onChange(value);
        setInputValue(value);
        setFilterValue("");
        setSelected(value);
      }
    }
    setIsOpen(false);
    setFocusedItemIndex(null);
    setActiveItem(null);
  };

  const onTextInputChange = (
    _event: React.FormEvent<HTMLInputElement>,
    value: string
  ) => {
    setInputValue(value);
    setFilterValue(value);
  };

  const handleMenuArrowKeys = (key: string, oldIndex?: number) => {
    if (isOpen && selectOptions.some((o) => !o.isDisabled)) {
      const currentIndex = oldIndex || focusedItemIndex;
      const indexToFocus =
        key === "ArrowUp"
          ? currentIndex === null || currentIndex === 0
            ? selectOptions.length - 1
            : currentIndex - 1
          : currentIndex === null || currentIndex === selectOptions.length - 1
            ? 0
            : currentIndex + 1;

      setFocusedItemIndex(indexToFocus);
      const focusedItem = selectOptions[indexToFocus];
      if (focusedItem.isDisabled) {
        handleMenuArrowKeys(key, indexToFocus);
      } else {
        setActiveItem(
          `select-typeahead-${focusedItem.value.replace(" ", "-")}`
        );
      }
    }
  };

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const enabledMenuItems = selectOptions.filter(
      (option) => !option.isDisabled
    );
    const [firstMenuItem] = enabledMenuItems;
    const focusedItem = focusedItemIndex
      ? enabledMenuItems[focusedItemIndex]
      : firstMenuItem;

    if (!focusedItem) return;

    switch (event.key) {
      // Select the first available option
      case "Enter":
        if (isOpen && focusedItem.value !== "no results") {
          const value = String(focusedItem.value);
          onSelect(undefined, value);
        } else {
          setIsOpen((prevIsOpen) => !prevIsOpen);
          setFocusedItemIndex(null);
          setActiveItem(null);
        }
        break;
      case "Tab":
      case "Escape":
        event.stopPropagation();
        setIsOpen(false);
        setActiveItem(null);
        break;
      case "ArrowUp":
      case "ArrowDown":
        event.preventDefault();
        handleMenuArrowKeys(event.key);
        break;
    }
  };

  const toggle = (toggleRef: React.Ref<MenuToggleElement>) => (
    <MenuToggle
      aria-label={toggleAriaLabel}
      id={toggleId}
      ref={toggleRef}
      variant="typeahead"
      onClick={onToggleClick}
      isExpanded={isOpen}
      isFullWidth={!width}
      style={{ width: width && width + "px" }}
    >
      <TextInputGroup isPlain>
        <TextInputGroupMain
          value={inputValue}
          onClick={onToggleClick}
          onChange={onTextInputChange}
          onKeyDown={onInputKeyDown}
          onBlur={() => {
            selectMultiple
              ? setInputValue("")
              : setInputValue(selected.toString());
          }}
          id="typeahead-select-input"
          autoComplete="off"
          innerRef={textInputRef}
          placeholder={placeholderText}
          {...(activeItem && { "aria-activedescendant": activeItem })}
          role="combobox"
          isExpanded={isOpen}
          aria-controls="select-typeahead-listbox"
        >
          {selectMultiple && (
            <ChipGroup aria-label="Current selections">
              {(Array.isArray(selected) ? selected : [selected]).map(
                (sel, index) => (
                  <Chip
                    key={index}
                    onClick={(ev) => {
                      ev.stopPropagation();
                      onSelect(undefined, sel);
                    }}
                  >
                    {sel}
                  </Chip>
                )
              )}
            </ChipGroup>
          )}
        </TextInputGroupMain>
        <TextInputGroupUtilities>
          {selectMultiple && selected.length > 0 && (
            <Button
              variant="plain"
              onClick={() => {
                setInputValue("");
                setSelected([]);
                onChange([]);
                textInputRef?.current?.focus();
              }}
              aria-label="Clear input value"
            >
              <TimesIcon aria-hidden />
            </Button>
          )}
          {!hideClearButton && !selectMultiple && !!inputValue && (
            <Button
              variant="plain"
              onClick={() => {
                setSelected("");
                setInputValue("");
                setFilterValue("");
                onChange("");
                textInputRef?.current?.focus();
              }}
              aria-label="Clear input value"
            >
              <TimesIcon aria-hidden />
            </Button>
          )}
        </TextInputGroupUtilities>
      </TextInputGroup>
    </MenuToggle>
  );
  return (
    <>
      <Select
        id={id}
        isOpen={isOpen}
        selected={selected}
        onSelect={onSelect}
        onOpenChange={() => {
          setFilterValue("");
          setIsOpen(false);
        }}
        toggle={toggle}
      >
        <SelectList
          id="select-typeahead-listbox"
          isAriaMultiselectable={selectMultiple}
        >
          {selectOptions.map((option, index) => (
            <SelectOption
              key={option.value}
              isFocused={focusedItemIndex === index}
              className={option.className}
              onClick={() => onSelect(undefined, option.value)}
              id={`select-typeahead-${option.value.replace(" ", "-")}`}
              {...option}
              ref={null}
            >
              {(option.children || option.value) as string}
            </SelectOption>
          ))}
        </SelectList>
      </Select>
    </>
  );
};
