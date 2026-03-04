import { FC, useRef, useState } from "react";
import { t } from "i18next";
import { toggle as toggleArray } from "radash";
import { useTranslation } from "react-i18next";
import {
  Button,
  ButtonVariant,
  Chip,
  ChipGroup,
  KeyTypes,
  MenuToggle,
  MenuToggleElement,
  MenuToggleProps,
  Select,
  SelectList,
  SelectOption,
  SelectOptionProps,
  TextInputGroup,
  TextInputGroupMain,
  TextInputGroupUtilities,
  Tooltip,
} from "@patternfly/react-core";
import { TimesCircleIcon } from "@patternfly/react-icons";

export type SelectTypeaheadOptionProps = {
  /** Human readable value.
   * 1. used as option content (may be overridden by optionProps.children)
   * 2. if not present the value prop is used instead.
   * 3. used for filtering the list of available options. If optionProps.children is used then its content should logically match the label prop.
   * 4. should be unique within the list of options (to avoid user confusion)
   */
  label?: string;
  // pass through props
  optionProps?: SelectOptionProps;
  // identity prop used to tract selection - should be unique within the list.
  value: string;
};

const createItemId = (value: unknown) =>
  `select-typeahead-${String(value)?.replace(" ", "-")}`;

type SimpleSelectTypeaheadProps = {
  dataTestId?: string;
  getToggleStatus?: (value: string) => MenuToggleProps["status"];
  isDisabled?: boolean;
  isFullWidth?: boolean;
  options: SelectTypeaheadOptionProps[];
  placeholder?: string;
  selectedValues: string[];
  setSelectedValues: (value: string[]) => void;
};

const skipWordSeparators = (word: string) => word.replaceAll(/[\s-_:]/g, "");

const getDisplayValue = (option: SelectTypeaheadOptionProps) => {
  if (!option) {
    return "";
  }
  const { label, value } = option;

  if (!label) {
    return value;
  }

  // label and value are (almost) the same
  if (
    skipWordSeparators(label).toLowerCase() ===
    skipWordSeparators(value).toLowerCase()
  ) {
    return label;
  }

  // show both human readable and machine readable values as
  // "label (value)"
  return t("composed.labelAndValue", { label, value });
};

export const SimpleSelectTypeahead: FC<SimpleSelectTypeaheadProps> = ({
  dataTestId,
  getToggleStatus,
  isDisabled,
  isFullWidth = false,
  options,
  placeholder,
  selectedValues,
  setSelectedValues,
}) => {
  const { t } = useTranslation();
  const [randomIdSuffix] = useState(crypto.randomUUID());

  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState<string>("");

  const [focusedItemIndex, setFocusedItemIndex] = useState<null | number>(null);
  const [activeItemId, setActiveItemId] = useState<null | string>(null);
  const textInputRef = useRef<HTMLInputElement>();

  const filteredOptions: SelectTypeaheadOptionProps[] = options
    ?.filter((opt) =>
      getDisplayValue(opt).toLowerCase().includes(inputValue.toLowerCase())
    )
    .map((opt) => ({
      ...opt,
      label: getDisplayValue(opt),
    }));

  const notAvailableOption: SelectTypeaheadOptionProps | false =
    options.length === 0 &&
      !inputValue && {
        label: t("message.noDataAvailableTitle"),
        optionProps: { isDisabled: true },
        value: "no data available",
      };

  const notFoundOption: SelectTypeaheadOptionProps | false =
    filteredOptions.length === 0 &&
      !!inputValue && {
        label: t("message.noResultsFoundFor", { value: inputValue }),
        optionProps: { isDisabled: true },
        value: "no results found",
      };

  const selectOptions: SelectTypeaheadOptionProps[] = [
    notAvailableOption,
    notFoundOption,
    ...filteredOptions,
  ].filter(Boolean);

  const setActiveAndFocusedItem = (itemIndex: number) => {
    setFocusedItemIndex(itemIndex);
    const focusedItem = selectOptions[itemIndex];
    setActiveItemId(createItemId(focusedItem.value));
  };

  const resetActiveAndFocusedItem = () => {
    setFocusedItemIndex(null);
    setActiveItemId(null);
  };

  const openMenu = () => {
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  const closeMenu = () => {
    setIsOpen(false);
    resetActiveAndFocusedItem();
  };

  const selectOption = (option: SelectTypeaheadOptionProps) => {
    closeMenu();
    setInputValue("");
    setSelectedValues(toggleArray(selectedValues, option.value));
  };

  const onSelect = (
    _event: React.MouseEvent<Element, MouseEvent> | undefined,
    value: number | string | undefined
  ) => {
    if (!value) return;

    const option = options.find((option) => option.value === value);
    if (option) {
      selectOption(option);
    }
  };

  const onTextInputChange = (
    _event: React.FormEvent<HTMLInputElement>,
    value: string
  ) => {
    setInputValue(value);

    if (value) {
      openMenu();
    }

    resetActiveAndFocusedItem();
  };

  const handleMenuArrowKeys = (key: string) => {
    let indexToFocus = 0;

    openMenu();

    if (selectOptions.every((option) => option.optionProps?.isDisabled)) {
      return;
    }

    if (key === KeyTypes.ArrowUp) {
      // When no index is set or at the first index, focus to the last, otherwise decrement focus index
      if (focusedItemIndex === null || focusedItemIndex === 0) {
        indexToFocus = selectOptions.length - 1;
      } else {
        indexToFocus = focusedItemIndex - 1;
      }

      // Skip disabled options
      while (selectOptions[indexToFocus]?.optionProps?.isDisabled) {
        indexToFocus--;
        if (indexToFocus === -1) {
          indexToFocus = selectOptions.length - 1;
        }
      }
    }

    if (key === KeyTypes.ArrowDown) {
      // When no index is set or at the last index, focus to the first, otherwise increment focus index
      if (
        focusedItemIndex === null ||
        focusedItemIndex === selectOptions.length - 1
      ) {
        indexToFocus = 0;
      } else {
        indexToFocus = focusedItemIndex + 1;
      }

      // Skip disabled options
      while (selectOptions[indexToFocus]?.optionProps?.isDisabled) {
        indexToFocus++;
        if (indexToFocus === selectOptions.length) {
          indexToFocus = 0;
        }
      }
    }

    setActiveAndFocusedItem(indexToFocus);
  };

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const focusedItem =
      focusedItemIndex !== null ? selectOptions[focusedItemIndex] : null;

    switch (event.key) {
      case "Enter":
        event.preventDefault();
        if (isOpen && focusedItem && !focusedItem.optionProps?.isAriaDisabled) {
          onSelect(undefined, focusedItem.value);
        }

        openMenu();

        break;
      case "ArrowUp":
      case "ArrowDown":
        event.preventDefault();
        handleMenuArrowKeys(event.key);
        break;
    }
  };

  const onToggleClick = () => {
    setIsOpen((isOpen) => !isOpen);
    textInputRef?.current?.focus();
  };

  const onTextInputClick = openMenu;

  const onClearButtonClick = () => {
    setSelectedValues([]);
    setInputValue("");
    resetActiveAndFocusedItem();
    textInputRef?.current?.focus();
  };

  const toggle = (toggleRef: React.Ref<MenuToggleElement>) => (
    <MenuToggle
      aria-label="Typeahead menu toggle"
      isDisabled={isDisabled}
      isExpanded={isOpen}
      isFullWidth={isFullWidth}
      onClick={onToggleClick}
      ref={toggleRef}
      status={getToggleStatus?.(inputValue)}
      variant="typeahead"
    >
      <TextInputGroup isPlain>
        <TextInputGroupMain
          autoComplete="off"
          innerRef={textInputRef}
          onChange={onTextInputChange}
          onClick={onTextInputClick}
          onKeyDown={onInputKeyDown}
          placeholder={placeholder}
          value={inputValue}
          {...(activeItemId && { "aria-activedescendant": activeItemId })}
          aria-controls={`select-typeahead-listbox-${randomIdSuffix}`}
          isExpanded={isOpen}
          role="combobox"
        >
          <ChipGroup aria-label="Current selections">
            {selectedValues.map((sel) => (
              <Chip
                key={sel}
                onClick={(ev) => {
                  ev.stopPropagation();
                  setSelectedValues(toggleArray(selectedValues, sel));
                }}
              >
                {sel}
              </Chip>
            ))}
          </ChipGroup>
        </TextInputGroupMain>
        {selectedValues.length > 0 && (
          <TextInputGroupUtilities>
            <Tooltip content={t("actions.clearAllSelections")}>
              <Button
                aria-label={t("actions.clearAllSelections")}
                icon={<TimesCircleIcon />}
                onClick={onClearButtonClick}
                variant={ButtonVariant.plain}
              />
            </Tooltip>
          </TextInputGroupUtilities>
        )}
      </TextInputGroup>
    </MenuToggle>
  );

  return (
    <Select
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          closeMenu();
        }
      }}
      data-test={dataTestId}
      id={dataTestId}
      isOpen={isOpen}
      isScrollable
      onSelect={onSelect}
      selected={selectedValues}
      toggle={toggle}
      variant="typeahead"
    >
      <SelectList id={`select-typeahead-listbox-${randomIdSuffix}`}>
        {selectOptions?.map(({ label, optionProps, value }, index) => {
          const { children, ...otherOptionProps } = optionProps ?? {};
          return (
            <SelectOption
              {...otherOptionProps}
              id={createItemId(value)}
              isFocused={focusedItemIndex === index}
              key={value}
              value={value}
            >
              {children ?? label ?? value}
            </SelectOption>
          );
        })}
      </SelectList>
    </Select>
  );
};

export default SimpleSelectTypeahead;
