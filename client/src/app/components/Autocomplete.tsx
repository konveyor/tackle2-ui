import React, { useState, useRef, useMemo } from "react";
import {
  Label,
  LabelProps,
  Flex,
  FlexItem,
  Menu,
  MenuContent,
  MenuItem,
  MenuList,
  Popper,
  SearchInput,
  Divider,
  Tooltip,
  MenuGroup,
} from "@patternfly/react-core";

const toString = (input: string | (() => string)) =>
  typeof input === "function" ? input() : input;

const createCompositeKey = (group: string, id: number) => `${group}:${id}`;

export interface AutocompleteOptionProps {
  /** id for the option */
  id: number;

  /** the text to display for the option */
  name: string | (() => string);

  /** the text to display on a label when the option is selected, defaults to `name` if not supplied */
  labelName?: string | (() => string);

  /** the tooltip to display on the Label when the option has been selected */
  tooltip?: string | (() => string);
  /** the group to display the option in */
  group?: string;
}

export interface IAutocompleteProps {
  onChange: (selections: AutocompleteOptionProps[]) => void;
  id?: string;

  /** The set of options to use for selection */
  options?: AutocompleteOptionProps[];
  isGrouped?: boolean;
  selections?: AutocompleteOptionProps[];

  placeholderText?: string;
  searchString?: string;
  searchInputAriaLabel?: string;
  labelColor?: LabelProps["color"];
  menuHeader?: string;
  noResultsMessage?: string;
}

interface GroupedOptions {
  [key: string]: AutocompleteOptionProps[];
}

/**
 * Multiple type-ahead with table complete and selection labels
 */
export const Autocomplete: React.FC<IAutocompleteProps> = ({
  id = "",
  onChange,
  options = [],
  isGrouped = false,
  placeholderText = "Search",
  searchString = "",
  searchInputAriaLabel = "Search input",
  labelColor,
  selections = [],
  menuHeader = "",
  noResultsMessage = "No results found",
}) => {
  const [inputValue, setInputValue] = useState(searchString);
  const [tabSelectedItemId, setTabSelectedItemId] = useState<string>();

  const [menuIsOpen, setMenuIsOpen] = useState(false);

  /** refs used to detect when clicks occur inside vs outside of the textInputGroup and menu popper */
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOptions = useMemo(() => {
    if (!selections || selections.length === 0) {
      return [];
    }
    return isGrouped
      ? options.filter((option) => {
          return selections.some((selection) => {
            return (
              selection.id === option.id && selection.group === option.group
            );
          });
        })
      : options.filter((option) => {
          return (
            selections.findIndex((selection) => selection.id === option.id) > -1
          );
        });
  }, [options, selections, isGrouped]);

  const filteredOptions = useMemo(() => {
    return options.filter((option) => {
      const isOptionSelected = selections.some((selection) => {
        const isSelectedById = selection.id === option.id;
        const isSelectedByGroup = isGrouped
          ? selection.group === option.group
          : true;
        return isSelectedById && isSelectedByGroup;
      });

      const isNameMatch = toString(option.name)
        .toLowerCase()
        .includes(inputValue.toLowerCase());
      return !isOptionSelected && isNameMatch;
    });
  }, [options, selections, inputValue, isGrouped]);

  const groupedOptions = useMemo((): GroupedOptions => {
    if (!isGrouped) {
      return {};
    }

    return filteredOptions.reduce((groups: GroupedOptions, option) => {
      const groupName = option.group || "Ungrouped";
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(option);
      return groups;
    }, {});
  }, [filteredOptions, isGrouped]);

  /** callback for removing a selection */
  const deleteSelectionByItemId = (
    idToDelete: number,
    groupToDelete?: string
  ) => {
    const newSelections = selections.filter((selection) => {
      if (isGrouped) {
        return !(
          selection.id === idToDelete && selection.group === groupToDelete
        );
      }
      return selection.id !== idToDelete;
    });

    onChange(newSelections);
  };

  /** lookup the option matching the itemId and add as a selection */
  const addSelectionByItemId = (compositeKey: string) => {
    const [group, idStr] = compositeKey.split(":");
    const id = parseInt(idStr, 10);
    const matchingOption = options.find(
      ({ id: optionId, group: optionGroup }) =>
        id === optionId && group === optionGroup
    );

    if (matchingOption) {
      onChange([...selections, matchingOption].filter(Boolean));
      setInputValue("");
      setMenuIsOpen(false);
    }
  };

  /** callback for updating the inputValue state in this component so that the input can be controlled */
  const handleSearchInputOnChange = (
    _event: React.FormEvent<HTMLInputElement>,
    value: string
  ) => {
    setInputValue(value);
  };

  /** add the current input value as a selection */
  const handleEnter = () => {
    if (tabSelectedItemId) {
      addSelectionByItemId(tabSelectedItemId);
      setTabSelectedItemId(undefined);
    }
  };

  /** close the menu, and if only 1 filtered option exists, select it */
  const handleTab = (event: React.KeyboardEvent) => {
    if (filteredOptions.length === 1) {
      const option = filteredOptions[0];
      const compositeKey =
        isGrouped && option.group
          ? createCompositeKey(option.group, option.id)
          : option.id.toString();
      setInputValue(toString(option.name));
      setTabSelectedItemId(compositeKey);
      event.preventDefault();
    }
    setMenuIsOpen(false);
  };

  /** close the menu when escape is hit */
  const handleEscape = (event: React.KeyboardEvent) => {
    event.stopPropagation();

    setMenuIsOpen(false);
  };

  /** allow the user to focus on the menu and navigate using the arrow keys */
  const handleArrowKey = () => {
    if (menuRef.current) {
      const firstElement = menuRef.current.querySelector<HTMLButtonElement>(
        "li > button:not(:disabled)"
      );
      firstElement?.focus();
    }
  };

  /** reopen the menu if it's closed and any un-designated keys are hit */
  const handleDefault = () => {
    if (!menuIsOpen) {
      setMenuIsOpen(true);
    }
  };

  /** enable keyboard only usage while focused on the text input */
  const handleSearchInputOnKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case "Enter":
        handleEnter();
        break;
      case "Escape":
        handleEscape(event);
        break;
      case "Tab":
        handleTab(event);
        break;
      case "ArrowUp":
      case "ArrowDown":
        handleArrowKey();
        break;
      default:
        handleDefault();
    }
  };

  /** apply focus to the text input */
  const focusTextInput = (closeMenu = false) => {
    searchInputRef.current?.querySelector("input")?.focus();
    closeMenu && setMenuIsOpen(false);
  };

  /** add the text of the selected menu item to the selected items */
  const handleMenuItemOnSelect = (
    event: React.MouseEvent<Element, MouseEvent> | undefined,
    itemId: number,
    groupName?: string
  ) => {
    if (!event) return;
    event.stopPropagation();
    focusTextInput(true);

    const compositeKey =
      isGrouped && groupName
        ? createCompositeKey(groupName, itemId)
        : itemId.toString();
    addSelectionByItemId(compositeKey);
  };

  /** close the menu when a click occurs outside of the menu or text input group */
  const handleOnDocumentClick = (event?: MouseEvent) => {
    if (!event) {
      return;
    }
    if (searchInputRef.current?.contains(event.target as HTMLElement)) {
      setMenuIsOpen(true);
    }
    if (
      menuRef.current &&
      !menuRef.current.contains(event.target as HTMLElement) &&
      searchInputRef.current &&
      !searchInputRef.current.contains(event.target as HTMLElement)
    ) {
      setMenuIsOpen(false);
    }
  };

  /** enable keyboard only usage while focused on the menu */
  const handleMenuOnKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case "Tab":
      case "Escape":
        event.preventDefault();
        focusTextInput();
        setMenuIsOpen(false);
        break;
    }
  };

  const hint = useMemo(() => {
    if (filteredOptions.length === 0) {
      return "";
    }

    if (filteredOptions.length === 1 && inputValue) {
      const fullHint = toString(filteredOptions[0].name);

      if (fullHint.toLowerCase().indexOf(inputValue.toLowerCase())) {
        // the match was found in a place other than the start, so typeahead wouldn't work right
        return "";
      } else {
        // use the input for the first part, otherwise case difference could make things look wrong
        return inputValue + fullHint.substring(inputValue.length);
      }
    }

    return "";
  }, [filteredOptions, inputValue]);

  const inputGroup = (
    <div ref={searchInputRef}>
      <SearchInput
        id={id}
        value={inputValue}
        hint={hint}
        onChange={handleSearchInputOnChange}
        onClear={() => setInputValue("")}
        onFocus={() => setMenuIsOpen(true)}
        onKeyDown={handleSearchInputOnKeyDown}
        placeholder={placeholderText}
        aria-label={searchInputAriaLabel}
      />
    </div>
  );

  const renderMenuItems = () => {
    if (isGrouped && groupedOptions) {
      return Object.entries(groupedOptions).map(([groupName, groupOptions]) => (
        <React.Fragment key={groupName}>
          <MenuGroup label={groupName}>
            <MenuList>
              {groupOptions.map((option) => (
                <MenuItem
                  key={option.id}
                  itemId={option.id.toString()}
                  onClick={(e) =>
                    isGrouped
                      ? handleMenuItemOnSelect(e, option.id, groupName)
                      : handleMenuItemOnSelect(e, option.id)
                  }
                >
                  {toString(option.name)}
                </MenuItem>
              ))}
              {/* if supplied, add the menu heading */}
              {menuHeader ? (
                <>
                  <MenuItem isDisabled key="heading" itemId="-2">
                    {menuHeader}
                  </MenuItem>
                  <Divider key="divider" />
                </>
              ) : undefined}

              {/* show a disabled "no result" when all menu items are filtered out */}
              {groupOptions.length === 0 ? (
                <MenuItem isDisabled key="no result" itemId="-1">
                  {noResultsMessage}
                </MenuItem>
              ) : undefined}
            </MenuList>
          </MenuGroup>
          <Divider />
        </React.Fragment>
      ));
    } else {
      return (
        <MenuList>
          {/* if supplied, add the menu heading */}
          {menuHeader ? (
            <>
              <MenuItem isDisabled key="heading" itemId="-2">
                {menuHeader}
              </MenuItem>
              <Divider key="divider" />
            </>
          ) : undefined}

          {/* show a disabled "no result" when all menu items are filtered out */}
          {filteredOptions.length === 0 ? (
            <MenuItem isDisabled key="no result" itemId="-1">
              {noResultsMessage}
            </MenuItem>
          ) : undefined}
          {filteredOptions.map((option) => (
            <MenuItem
              key={option.id}
              itemId={option.id.toString()}
              onClick={(e) => handleMenuItemOnSelect(e, option.id)}
            >
              {toString(option.name)}
            </MenuItem>
          ))}
        </MenuList>
      );
    }
  };
  const menu = (
    <Menu ref={menuRef} onKeyDown={handleMenuOnKeyDown} isScrollable>
      <MenuContent>{renderMenuItems()}</MenuContent>
    </Menu>
  );
  return (
    <Flex direction={{ default: "column" }}>
      <FlexItem key="input">
        <Popper
          trigger={inputGroup}
          triggerRef={searchInputRef}
          popper={menu}
          popperRef={menuRef}
          appendTo={() => searchInputRef.current || document.body}
          isVisible={menuIsOpen}
          onDocumentClick={handleOnDocumentClick}
        />
      </FlexItem>
      <FlexItem key="chips">
        <Flex spaceItems={{ default: "spaceItemsXs" }}>
          {selectedOptions.map(({ id, name, group, labelName, tooltip }) => (
            <FlexItem key={`${group}:${id}`}>
              <LabelToolip content={tooltip}>
                <Label
                  color={labelColor}
                  onClose={() => {
                    deleteSelectionByItemId(id, group);
                  }}
                >
                  {toString(labelName || name)}
                </Label>
              </LabelToolip>
            </FlexItem>
          ))}
        </Flex>
      </FlexItem>
    </Flex>
  );
};

const LabelToolip: React.FC<{
  content?: AutocompleteOptionProps["tooltip"];
  children: React.ReactElement;
}> = ({ content, children }) =>
  content ? (
    <Tooltip content={<div>{toString(content)}</div>}>{children}</Tooltip>
  ) : (
    children
  );
