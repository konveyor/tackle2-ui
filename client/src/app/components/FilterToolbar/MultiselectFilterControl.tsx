import * as React from "react";
import {
  Badge,
  Button,
  MenuToggle,
  MenuToggleElement,
  Select,
  SelectGroup,
  SelectList,
  SelectOption,
  TextInputGroup,
  TextInputGroupMain,
  TextInputGroupUtilities,
  ToolbarChip,
  ToolbarFilter,
  Tooltip,
} from "@patternfly/react-core";
import { IFilterControlProps } from "./FilterControl";
import {
  IMultiselectFilterCategory,
  FilterSelectOptionProps,
} from "./FilterToolbar";
import { css } from "@patternfly/react-styles";
import { TimesIcon } from "@patternfly/react-icons";

import "./select-overrides.css";

const CHIP_BREAK_DELINEATOR = " / ";

export interface IMultiselectFilterControlProps<TItem>
  extends IFilterControlProps<TItem, string> {
  category: IMultiselectFilterCategory<TItem, string>;
  isScrollable?: boolean;
}

export const MultiselectFilterControl = <TItem,>({
  category,
  filterValue,
  setFilterValue,
  showToolbarItem,
  isDisabled = false,
  isScrollable = false,
}: React.PropsWithChildren<
  IMultiselectFilterControlProps<TItem>
>): JSX.Element | null => {
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = React.useState(false);

  const [selectOptions, setSelectOptions] = React.useState<
    FilterSelectOptionProps[]
  >(Array.isArray(category.selectOptions) ? category.selectOptions : []);

  React.useEffect(() => {
    setSelectOptions(
      Array.isArray(category.selectOptions) ? category.selectOptions : []
    );
  }, [category.selectOptions]);

  const hasGroupings = !Array.isArray(selectOptions);

  const flatOptions: FilterSelectOptionProps[] = !hasGroupings
    ? selectOptions
    : (Object.values(selectOptions).flatMap(
        (i) => i
      ) as FilterSelectOptionProps[]);

  const getOptionKeyFromOptionValue = (optionValue: string) =>
    flatOptions.find(({ value }) => value === optionValue)?.key;

  const getOptionValueFromOptionKey = (optionKey: string) =>
    flatOptions.find(({ key }) => key === optionKey)?.value;

  const getOptionKeyFromChip = (chipDisplayValue: string) => {
    return flatOptions.find(({ value }) => value === chipDisplayValue)?.key;
  };

  const [focusedItemIndex, setFocusedItemIndex] = React.useState<number | null>(
    null
  );

  const [activeItem, setActiveItem] = React.useState<string | null>(null);
  const textInputRef = React.useRef<HTMLInputElement>();
  const [inputValue, setInputValue] = React.useState<string>("");

  const onFilterClearAll = () => setFilterValue([]);
  const onFilterClear = (chip: string | ToolbarChip) => {
    const displayValue = typeof chip === "string" ? chip : chip.key;
    const optionKey = getOptionKeyFromChip(displayValue);

    if (optionKey) {
      const newValue = filterValue?.filter((val) => val !== optionKey) ?? [];
      setFilterValue(newValue.length > 0 ? newValue : null);
    }
  };

  /*
   * Note: Chips can be a `ToolbarChip` or a plain `string`.  Use a hack to split a
   *       selected option in 2 parts.  Assuming the option is in the format "Group / Item"
   *       break the text and show a chip with the Item and the Group as a tooltip.
   */
  const chips = filterValue?.map((s, index) => {
    const displayValue = getOptionValueFromOptionKey(s);
    const chip: string = displayValue?.toString() ?? "";
    const idx = chip.indexOf(CHIP_BREAK_DELINEATOR);

    if (idx > 0) {
      const tooltip = chip.substring(0, idx);
      const text = chip.substring(idx + CHIP_BREAK_DELINEATOR.length);
      return {
        key: chip,
        node: (
          <Tooltip id={`tooltip-chip-${index}`} content={<div>{tooltip}</div>}>
            <div>{text}</div>
          </Tooltip>
        ),
      } as ToolbarChip;
    }
    return chip;
  });

  const renderSelectOptions = (
    filter: (option: FilterSelectOptionProps, groupName?: string) => boolean
  ) =>
    hasGroupings
      ? Object.entries(
          selectOptions as Record<string, FilterSelectOptionProps[]>
        )
          .sort(([groupA], [groupB]) => groupA.localeCompare(groupB))
          .map(([group, options], index) => {
            const groupFiltered =
              options?.filter((o) => filter(o, group)) ?? [];
            return groupFiltered.length === 0 ? undefined : (
              <SelectGroup key={`group-${index}`} label={group}>
                {groupFiltered.map((optionProps) => {
                  const optionKey = getOptionKeyFromOptionValue(
                    optionProps.value
                  );
                  if (!optionKey) return null;
                  return (
                    <SelectOption
                      {...optionProps}
                      key={optionProps.key}
                      isSelected={filterValue?.includes(optionKey)}
                    />
                  );
                })}
              </SelectGroup>
            );
          })
          .filter(Boolean)
      : flatOptions
          .filter((o) => filter(o))
          .map((optionProps, index) => {
            const optionKey = getOptionKeyFromOptionValue(optionProps.value);
            if (!optionKey) return null;
            return (
              <SelectOption
                {...optionProps}
                {...(!optionProps.isDisabled && { hasCheckbox: true })}
                key={optionProps.value || optionProps.children}
                value={optionProps.value}
                isFocused={focusedItemIndex === index}
                isSelected={filterValue?.includes(optionKey)}
              >
                {optionProps.value}
              </SelectOption>
            );
          });

  const onSelect = (value: string | undefined) => {
    if (value && value !== "No results") {
      const optionKey = getOptionKeyFromOptionValue(value);

      if (optionKey) {
        let newFilterValue: string[];

        if (filterValue && filterValue.includes(optionKey)) {
          newFilterValue = filterValue.filter((item) => item !== optionKey);
        } else {
          newFilterValue = filterValue
            ? [...filterValue, optionKey]
            : [optionKey];
        }

        setFilterValue(newFilterValue);
      }
    }
    textInputRef.current?.focus();
  };

  const handleMenuArrowKeys = (key: string) => {
    let indexToFocus = 0;

    if (isFilterDropdownOpen) {
      if (key === "ArrowUp") {
        if (focusedItemIndex === null || focusedItemIndex === 0) {
          indexToFocus = selectOptions.length - 1;
        } else {
          indexToFocus = focusedItemIndex - 1;
        }
      }

      if (key === "ArrowDown") {
        if (
          focusedItemIndex === null ||
          focusedItemIndex === selectOptions.length - 1
        ) {
          indexToFocus = 0;
        } else {
          indexToFocus = focusedItemIndex + 1;
        }
      }

      setFocusedItemIndex(indexToFocus);
      const focusedItem = selectOptions.filter((option) => !option.isDisabled)[
        indexToFocus
      ];
      setActiveItem(
        `select-multi-typeahead-checkbox-${focusedItem.value.replace(" ", "-")}`
      );
    }
  };

  React.useEffect(() => {
    let newSelectOptions = Array.isArray(category.selectOptions)
      ? category.selectOptions
      : [];

    if (inputValue) {
      newSelectOptions = Array.isArray(category.selectOptions)
        ? category.selectOptions?.filter((menuItem) =>
            String(menuItem.value)
              .toLowerCase()
              .includes(inputValue.trim().toLowerCase())
          )
        : [];

      if (!newSelectOptions.length) {
        newSelectOptions = [
          {
            key: "no-results",
            isDisabled: true,
            hasCheckbox: false,
            children: `No results found for "${inputValue}"`,
            value: "No results",
          },
        ];
      }

      if (!isFilterDropdownOpen) {
        setIsFilterDropdownOpen(true);
      }
    }

    setSelectOptions(newSelectOptions);
    setFocusedItemIndex(null);
    setActiveItem(null);
  }, [inputValue]);

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const enabledMenuItems = Array.isArray(selectOptions)
      ? selectOptions.filter((option) => !option.isDisabled)
      : [];
    const [firstMenuItem] = enabledMenuItems;
    const focusedItem = focusedItemIndex
      ? enabledMenuItems[focusedItemIndex]
      : firstMenuItem;

    const newSelectOptions = flatOptions.filter((menuItem) =>
      menuItem.value.toLowerCase().includes(inputValue.toLowerCase())
    );
    const selectedItem =
      newSelectOptions.find(
        (option) => option.value.toLowerCase() === inputValue.toLowerCase()
      ) || focusedItem;

    switch (event.key) {
      case "Enter":
        if (!isFilterDropdownOpen) {
          setIsFilterDropdownOpen((prev) => !prev);
        } else if (selectedItem && selectedItem.value !== "No results") {
          onSelect(selectedItem.value);
        }
        break;
      case "Tab":
      case "Escape":
        setIsFilterDropdownOpen(false);
        setActiveItem(null);
        break;
      case "ArrowUp":
      case "ArrowDown":
        event.preventDefault();
        handleMenuArrowKeys(event.key);
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
  };

  const toggle = (toggleRef: React.Ref<MenuToggleElement>) => (
    <MenuToggle
      ref={toggleRef}
      variant="typeahead"
      onClick={() => {
        setIsFilterDropdownOpen(!isFilterDropdownOpen);
      }}
      isExpanded={isFilterDropdownOpen}
      isDisabled={isDisabled || !category.selectOptions.length}
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
          id="typeahead-select-input"
          autoComplete="off"
          innerRef={textInputRef}
          placeholder={category.placeholderText}
          {...(activeItem && { "aria-activedescendant": activeItem })}
          role="combobox"
          isExpanded={isFilterDropdownOpen}
          aria-controls="select-typeahead-listbox"
        />

        <TextInputGroupUtilities>
          {!!inputValue && (
            <Button
              variant="plain"
              onClick={() => {
                setInputValue("");
                setFilterValue(null);
                textInputRef?.current?.focus();
              }}
              aria-label="Clear input value"
            >
              <TimesIcon aria-hidden />
            </Button>
          )}
          {filterValue?.length ? (
            <Badge isRead>{filterValue.length}</Badge>
          ) : null}
        </TextInputGroupUtilities>
      </TextInputGroup>
    </MenuToggle>
  );

  return (
    <ToolbarFilter
      id={`filter-control-${category.key}`}
      chips={chips}
      deleteChip={(_, chip) => onFilterClear(chip)}
      deleteChipGroup={onFilterClearAll}
      categoryName={category.title}
      showToolbarItem={showToolbarItem}
    >
      <Select
        className={css(isScrollable && "isScrollable")}
        aria-label={category.title}
        toggle={toggle}
        selected={filterValue}
        onOpenChange={(isOpen) => setIsFilterDropdownOpen(isOpen)}
        onSelect={(_, selection) => onSelect(selection as string)}
        isOpen={isFilterDropdownOpen}
      >
        <SelectList id="select-multi-typeahead-checkbox-listbox">
          {renderSelectOptions(() => true)}
        </SelectList>
      </Select>
    </ToolbarFilter>
  );
};
