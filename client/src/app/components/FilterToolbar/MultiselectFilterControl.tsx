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
  SelectOptionProps,
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
  const hasGroupings = !Array.isArray(selectOptions);
  const flatOptions: FilterSelectOptionProps[] = !hasGroupings
    ? selectOptions
    : (Object.values(selectOptions).flatMap(
        (i) => i
      ) as FilterSelectOptionProps[]);

  React.useEffect(() => {
    if (Array.isArray(category.selectOptions)) {
      setSelectOptions(category.selectOptions);
    }
  }, [category.selectOptions]);

  const [focusedItemIndex, setFocusedItemIndex] = React.useState<number | null>(
    null
  );

  const [activeItem, setActiveItem] = React.useState<string | null>(null);
  const textInputRef = React.useRef<HTMLInputElement>();
  const [inputValue, setInputValue] = React.useState<string>("");

  const getOptionKeyFromOptionValue = (
    optionValue: string | SelectOptionProps
  ) => flatOptions.find((option) => option?.value === optionValue)?.key;

  const getOptionValueFromOptionKey = (optionKey: string) =>
    flatOptions.find(({ key }) => key === optionKey)?.value;

  const onFilterClear = (chip: string | ToolbarChip) => {
    const chipKey = typeof chip === "string" ? chip : chip.key;
    const newFilterValue = filterValue
      ? filterValue.filter((selection) => selection !== chipKey)
      : filterValue;

    setFilterValue(newFilterValue);
  };

  // Select expects "selections" to be an array of the "value" props from the relevant optionProps
  const selections = filterValue?.map(getOptionValueFromOptionKey) ?? [];

  /*
   * Note: Chips can be a `ToolbarChip` or a plain `string`.  Use a hack to split a
   *       selected option in 2 parts.  Assuming the option is in the format "Group / Item"
   *       break the text and show a chip with the Item and the Group as a tooltip.
   */
  const chips = selections.map((s, index) => {
    const chip: string = s?.toString() ?? "";
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
            return groupFiltered.length == 0 ? undefined : (
              <SelectGroup key={`group-${index}`} label={group}>
                {groupFiltered.map((optionProps) => (
                  <SelectOption {...optionProps} key={optionProps.key} />
                ))}
              </SelectGroup>
            );
          })
          .filter(Boolean)
      : flatOptions
          .filter((o) => filter(o))
          .map((optionProps, index) => (
            <SelectOption
              {...optionProps}
              {...(!optionProps.isDisabled && { hasCheckbox: true })}
              key={optionProps.value || optionProps.children}
              isFocused={focusedItemIndex === index}
              id={`select-multi-typeahead-${optionProps.value.replace(
                " ",
                "-"
              )}`}
              ref={null}
              isSelected={filterValue?.includes(optionProps.value)}
            >
              {optionProps.value}
            </SelectOption>
          ));

  const onSelect = (value: string | undefined) => {
    if (value && value !== "No results") {
      const newFilterValue = filterValue ? [...filterValue, value] : [value];
      setFilterValue(newFilterValue);
    }

    textInputRef.current?.focus();
  };

  const handleMenuArrowKeys = (key: string) => {
    if (isFilterDropdownOpen && Array.isArray(selectOptions)) {
      let indexToFocus: number = focusedItemIndex ?? -1;

      if (key === "ArrowUp") {
        indexToFocus =
          indexToFocus <= 0 ? selectOptions.length - 1 : indexToFocus - 1;
      } else if (key === "ArrowDown") {
        indexToFocus =
          indexToFocus >= selectOptions.length - 1 ? 0 : indexToFocus + 1;
      }

      while (selectOptions[indexToFocus].isDisabled) {
        indexToFocus = key === "ArrowUp" ? indexToFocus - 1 : indexToFocus + 1;
        if (indexToFocus < 0) {
          indexToFocus = selectOptions.length - 1;
        } else if (indexToFocus >= selectOptions.length) {
          indexToFocus = 0;
        }
      }

      setFocusedItemIndex(indexToFocus);
      const focusedItem = selectOptions[indexToFocus];
      setActiveItem(`select-typeahead-${focusedItem.value.replace(" ", "-")}`);
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
              .includes(inputValue.toLowerCase())
          )
        : [];

      if (!newSelectOptions.length) {
        newSelectOptions = [
          {
            key: "no-results",
            isDisabled: true,
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
  }, [inputValue, isFilterDropdownOpen, category.selectOptions]);

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
        event.preventDefault();
        setSelectOptions(newSelectOptions);
        setIsFilterDropdownOpen(true);

        if (
          isFilterDropdownOpen &&
          selectedItem &&
          selectedItem.value !== "no results"
        ) {
          setInputValue("");

          const newFilterValue = [...(filterValue || [])];
          const optionValue = getOptionValueFromOptionKey(selectedItem.value);

          if (newFilterValue.includes(optionValue)) {
            const indexToRemove = newFilterValue.indexOf(optionValue);
            newFilterValue.splice(indexToRemove, 1);
          } else {
            newFilterValue.push(optionValue);
          }

          setFilterValue(newFilterValue);
          setIsFilterDropdownOpen(false);
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
