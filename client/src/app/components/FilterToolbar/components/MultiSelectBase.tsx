import { FC, useRef, useState } from "react";
import {
  Badge,
  Button,
  Label,
  MenuToggle,
  MenuToggleElement,
  MenuToggleProps,
  Select,
  SelectList,
  SelectOption,
  TextInputGroup,
  TextInputGroupMain,
  TextInputGroupUtilities,
} from "@patternfly/react-core";
import { TimesIcon } from "@patternfly/react-icons";

import { FilterSelectOptionProps } from "../FilterToolbar";

export interface MultiSelectProps {
  id?: string;
  isScrollable: boolean;
  options: FilterSelectOptionProps[];
  values?: string[];
  onSelect: (value: string) => void;
  placeholderText?: string;
  isDisabled?: boolean;
  isFullWidth?: boolean;
  ariaLabel?: string;
  toggleId?: string;
  toggleAriaLabel?: string;
  toggleStatus?: MenuToggleProps["status"];
  categoryKey?: string;
}

const NO_RESULTS = "no-results";

export const MultiSelectBase: FC<MultiSelectProps> = ({
  options,
  ariaLabel,
  categoryKey,
  values,
  placeholderText,
  onSelect: onSelectCallback,
  isDisabled = false,
  isScrollable = false,
}: MultiSelectProps): JSX.Element | null => {
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [inputValue, setInputValue] = useState<string>("");
  const textInputRef = useRef<HTMLInputElement>();

  const idPrefix = `multi-select-${categoryKey ?? ""}`;
  const withPrefix = (id: string) => `${idPrefix}-${id}`;

  const filteredOptions = options?.filter(({ label, value, groupLabel }) =>
    [label ?? value, groupLabel]
      .filter(Boolean)
      .map((it) => it.toLocaleLowerCase())
      .some((it) => it.includes(inputValue?.trim().toLowerCase() ?? ""))
  );

  const onSelect = (value: string | undefined) => {
    if (!value || value === NO_RESULTS) {
      return;
    }

    onSelectCallback(value);
  };

  const {
    focusedItemIndex,
    getFocusedItem,
    clearFocusedItemIndex,
    moveFocusedItemIndex,
  } = useFocusHandlers({
    filteredOptions,
  });

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case "Enter":
        if (!isFilterDropdownOpen) {
          setIsFilterDropdownOpen(true);
        } else if (getFocusedItem()?.value) {
          onSelect(getFocusedItem()?.value);
        }
        textInputRef?.current?.focus();
        break;
      case "Tab":
      case "Escape":
        setIsFilterDropdownOpen(false);
        clearFocusedItemIndex();
        break;
      case "ArrowUp":
      case "ArrowDown":
        event.preventDefault();
        if (isFilterDropdownOpen) {
          moveFocusedItemIndex(event.key);
        } else {
          setIsFilterDropdownOpen(true);
        }
        break;
      default:
        break;
    }
  };

  const onTextInputChange = (
    _event: React.FormEvent<HTMLInputElement>,
    value: string
  ) => {
    setInputValue(value);
    if (!isFilterDropdownOpen) {
      setIsFilterDropdownOpen(true);
    }
  };

  const toggle = (toggleRef: React.Ref<MenuToggleElement>) => (
    <MenuToggle
      ref={toggleRef}
      variant="typeahead"
      onClick={() => {
        setIsFilterDropdownOpen(!isFilterDropdownOpen);
      }}
      isExpanded={isFilterDropdownOpen}
      isDisabled={isDisabled || !options.length}
      isFullWidth
    >
      <TextInputGroup isPlain>
        <TextInputGroupMain
          value={inputValue}
          onClick={() => {
            setIsFilterDropdownOpen(!isFilterDropdownOpen);
          }}
          onChange={onTextInputChange}
          onKeyDown={onInputKeyDown}
          id={withPrefix("typeahead-select-input")}
          autoComplete="off"
          innerRef={textInputRef}
          placeholder={placeholderText}
          aria-activedescendant={
            getFocusedItem()
              ? withPrefix(`option-${focusedItemIndex}`)
              : undefined
          }
          role="combobox"
          isExpanded={isFilterDropdownOpen}
          aria-controls={withPrefix("select-typeahead-listbox")}
        />

        <TextInputGroupUtilities>
          {!!inputValue && (
            <Button
              variant="plain"
              onClick={() => {
                setInputValue("");
                textInputRef?.current?.focus();
              }}
              aria-label="Clear input value"
            >
              <TimesIcon aria-hidden />
            </Button>
          )}
          {values?.length ? <Badge isRead>{values.length}</Badge> : null}
        </TextInputGroupUtilities>
      </TextInputGroup>
    </MenuToggle>
  );

  return (
    <Select
      isScrollable={isScrollable}
      aria-label={ariaLabel}
      toggle={toggle}
      selected={values}
      onOpenChange={(isOpen) => setIsFilterDropdownOpen(isOpen)}
      onSelect={(_, selection) => onSelect(selection as string)}
      isOpen={isFilterDropdownOpen}
    >
      <SelectList id={withPrefix("select-typeahead-listbox")}>
        {filteredOptions.map(
          ({ groupLabel, label, value, optionProps = {} }, index) => (
            <SelectOption
              {...optionProps}
              {...(!optionProps.isDisabled && { hasCheckbox: true })}
              key={value}
              id={withPrefix(`option-${index}`)}
              value={value}
              isFocused={focusedItemIndex === index}
              isSelected={values?.includes(value)}
            >
              {!!groupLabel && <Label>{groupLabel}</Label>} {label ?? value}
            </SelectOption>
          )
        )}
        {filteredOptions.length === 0 && (
          <SelectOption
            isDisabled
            hasCheckbox={false}
            key={NO_RESULTS}
            value={NO_RESULTS}
            isSelected={false}
          >
            {`No results found for "${inputValue}"`}
          </SelectOption>
        )}
      </SelectList>
    </Select>
  );
};

const useFocusHandlers = ({
  filteredOptions,
}: {
  filteredOptions: FilterSelectOptionProps[];
}) => {
  const [focusedItemIndex, setFocusedItemIndex] = useState<number>(0);

  const moveFocusedItemIndex = (key: string) =>
    setFocusedItemIndex(calculateFocusedItemIndex(key));

  const calculateFocusedItemIndex = (key: string): number => {
    if (!filteredOptions.length) {
      return 0;
    }

    if (key === "ArrowUp") {
      return focusedItemIndex <= 0
        ? filteredOptions.length - 1
        : focusedItemIndex - 1;
    }

    if (key === "ArrowDown") {
      return focusedItemIndex >= filteredOptions.length - 1
        ? 0
        : focusedItemIndex + 1;
    }
    return 0;
  };

  const getFocusedItem = () =>
    filteredOptions[focusedItemIndex] &&
    !filteredOptions[focusedItemIndex]?.optionProps?.isDisabled
      ? filteredOptions[focusedItemIndex]
      : undefined;

  return {
    moveFocusedItemIndex,
    focusedItemIndex,
    getFocusedItem,
    clearFocusedItemIndex: () => setFocusedItemIndex(0),
  };
};
