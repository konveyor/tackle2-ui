import { FC, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
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

import {
  createItemId,
  getDisplayValue,
  getStableIndex,
  noResultsId,
  toDisplayValue,
} from "./selectUtils";
import { useFocusHandlers } from "./useFocusHandlers";

export interface MultiSelectProps {
  id?: string;
  isScrollable?: boolean;
  options: FilterSelectOptionProps[];
  values?: string[];
  onSelect: (value?: string) => void;
  placeholderText?: string;
  isDisabled?: boolean;
  isFullWidth?: boolean;
  ariaLabel?: string;
  toggleId?: string;
  toggleAriaLabel?: string;
  toggleStatus?: MenuToggleProps["status"];
  categoryKey: string;
  hasCheckbox?: boolean;
  hasBadge?: boolean;
  showSelectedInToggle?: boolean;
  closeMenuOnSelect?: boolean;
}

export const MultiSelectBase: FC<MultiSelectProps> = ({
  id,
  options,
  ariaLabel,
  categoryKey,
  values,
  placeholderText,
  onSelect: onSelectCallback,
  isDisabled = false,
  isScrollable = true,
  isFullWidth = true,
  toggleId,
  toggleAriaLabel,
  toggleStatus,
  hasCheckbox,
  hasBadge,
  showSelectedInToggle,
  closeMenuOnSelect,
}: MultiSelectProps): JSX.Element | null => {
  const { t } = useTranslation();
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const textInputRef = useRef<HTMLInputElement>();

  const selectedDisplayValue = showSelectedInToggle
    ? getDisplayValue(values?.[0] ?? "", options)
    : "";
  const [inputValue, setInputValue] = useState<string>(
    showSelectedInToggle ? selectedDisplayValue : ""
  );

  // extend "empty" search state: show all options if a value is selected
  const showAllOptions =
    showSelectedInToggle &&
    (!inputValue || inputValue === selectedDisplayValue);

  const filteredOptions = options?.filter(
    (opt) =>
      showAllOptions ||
      [toDisplayValue(opt), opt.groupLabel]
        .filter(Boolean)
        .map((it) => it.toLocaleLowerCase())
        .some((it) => it.includes(inputValue?.trim().toLowerCase() ?? ""))
  );

  const onSelect = (value: string | undefined) => {
    if (!value || value === noResultsId(categoryKey)) {
      return;
    }

    onSelectCallback(value);
    if (showSelectedInToggle) {
      setInputValue(getDisplayValue(value, options));
    }
    if (closeMenuOnSelect) {
      closeMenu();
    }
  };

  const closeMenu = () => {
    setIsFilterDropdownOpen(false);
    resetActiveAndFocusedItem();
    textInputRef?.current?.focus();
  };

  const setInputToSelected = () => {
    if (showSelectedInToggle) {
      setInputValue(selectedDisplayValue);
    }
  };

  const {
    focusedItemIndex,
    focusedItem,
    activeItemId,
    resetActiveAndFocusedItem,
    moveFocusedItemIndex,
  } = useFocusHandlers({
    filteredOptions,
    options,
    categoryKey,
  });

  const onInputKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement | HTMLDivElement>
  ) => {
    switch (event.key) {
      case "Enter":
        event.preventDefault();
        if (
          isFilterDropdownOpen &&
          focusedItem &&
          !focusedItem.optionProps?.isAriaDisabled
        ) {
          onSelect(focusedItem.value);
        } else if (!isFilterDropdownOpen) {
          setIsFilterDropdownOpen(true);
          moveFocusedItemIndex("ArrowDown");
        }
        break;
      case "ArrowUp":
      case "ArrowDown":
        if (!isFilterDropdownOpen) {
          setIsFilterDropdownOpen(true);
        }
        moveFocusedItemIndex(event.key);
        break;
    }
  };

  const onOpenChangeKeyDown = (
    isOpen: boolean,
    event: React.KeyboardEvent<HTMLInputElement | HTMLDivElement>
  ) => {
    if (isOpen && ["Tab", "Escape"].includes(event.key)) {
      event.preventDefault();
      // prevent closing the modal(ESC) or leaving the input(TAB)
      // close the dropdown first
      event.stopPropagation();
      setIsFilterDropdownOpen(false);
      resetActiveAndFocusedItem();
    }
  };

  const onClearButtonClick = () => {
    onSelectCallback(undefined);
    setInputValue("");
    resetActiveAndFocusedItem();
    textInputRef?.current?.focus();
  };

  const onTextInputChange = (
    _event: React.FormEvent<HTMLInputElement>,
    newInputValue: string
  ) => {
    setInputValue(newInputValue);
    if (!isFilterDropdownOpen) {
      setIsFilterDropdownOpen(true);
    }
    resetActiveAndFocusedItem();

    if (
      showSelectedInToggle &&
      newInputValue?.trim() !== selectedDisplayValue?.trim()
    ) {
      onSelectCallback(undefined);
    }
  };

  const onToggleClick = () => {
    setIsFilterDropdownOpen((isOpen) => !isOpen);
    textInputRef?.current?.focus();
  };

  const toggle = (toggleRef: React.Ref<MenuToggleElement>) => (
    <MenuToggle
      ref={toggleRef}
      id={toggleId}
      aria-label={toggleAriaLabel}
      variant="typeahead"
      status={toggleStatus}
      onClick={onToggleClick}
      isExpanded={isFilterDropdownOpen}
      isDisabled={isDisabled || !options.length}
      isFullWidth={isFullWidth}
    >
      <TextInputGroup isPlain>
        <TextInputGroupMain
          value={inputValue}
          onClick={() => {
            setIsFilterDropdownOpen(true);
          }}
          onChange={onTextInputChange}
          onKeyDown={onInputKeyDown}
          onKeyDownCapture={(event) =>
            onOpenChangeKeyDown(isFilterDropdownOpen, event)
          }
          id={createItemId("input", categoryKey)}
          autoComplete="off"
          innerRef={textInputRef}
          placeholder={placeholderText}
          {...(activeItemId && { "aria-activedescendant": activeItemId })}
          role="combobox"
          isExpanded={isFilterDropdownOpen}
          aria-controls={createItemId("listbox", categoryKey)}
        />

        <TextInputGroupUtilities>
          {!!inputValue && (
            <Button
              variant="plain"
              onClick={onClearButtonClick}
              aria-label={t("actions.clearInputValue")}
            >
              <TimesIcon aria-hidden />
            </Button>
          )}
          {values?.length && hasBadge ? (
            <Badge
              isRead
              aria-label={t("composed.selectedCount", {
                count: values.length,
              })}
            >
              {values.length}
            </Badge>
          ) : null}
        </TextInputGroupUtilities>
      </TextInputGroup>
    </MenuToggle>
  );

  return (
    <Select
      id={id}
      isScrollable={isScrollable}
      aria-label={ariaLabel}
      toggle={toggle}
      selected={values}
      onOpenChange={() => {
        closeMenu();
        setInputToSelected();
      }}
      onSelect={(_, selection) => onSelect(selection as string)}
      isOpen={isFilterDropdownOpen}
      variant="typeahead"
    >
      <SelectList id={createItemId("listbox", categoryKey)}>
        {filteredOptions.map(
          ({ groupLabel, label, value, optionProps = {} }, index) => (
            <SelectOption
              {...optionProps}
              {...(!optionProps.isDisabled && { hasCheckbox })}
              key={value}
              id={createItemId(getStableIndex(value, options), categoryKey)}
              value={value}
              isFocused={focusedItemIndex === index}
              isSelected={values?.includes(value)}
              ref={null}
            >
              {!!groupLabel && <Label>{groupLabel}</Label>} {label ?? value}
            </SelectOption>
          )
        )}
        {filteredOptions.length === 0 && (
          <SelectOption
            isDisabled
            hasCheckbox={false}
            key={noResultsId(categoryKey)}
            value={noResultsId(categoryKey)}
            isSelected={false}
          >
            {t("message.noResultsFoundBodyFor", { input: inputValue })}
          </SelectOption>
        )}
      </SelectList>
    </Select>
  );
};
