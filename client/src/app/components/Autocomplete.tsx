import React, { useState, useRef } from "react";
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
} from "@patternfly/react-core";

export interface IAutocompleteProps {
  onChange: (selections: string[]) => void;
  allowUserOptions?: boolean;
  options?: string[];
  placeholderText?: string;
  searchString?: string;
  searchInputAriaLabel?: string;
  labelColor?: LabelProps["color"];
  selections?: string[];
  menuHeader?: string;
  noResultsMessage?: string;
}

export const Autocomplete: React.FC<IAutocompleteProps> = ({
  onChange,
  options = [],
  allowUserOptions = false,
  placeholderText = "Search",
  searchString = "",
  searchInputAriaLabel = "Search input",
  labelColor,
  selections = [],
  menuHeader = "",
  noResultsMessage = "No results found",
}) => {
  const [inputValue, setInputValue] = useState(searchString);
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const [currentChips, setCurrentChips] = useState<Set<string>>(
    new Set(selections)
  );
  const [hint, setHint] = useState("");
  const [menuItems, setMenuItems] = useState<React.ReactElement[]>([]);

  /** refs used to detect when clicks occur inside vs outside of the textInputGroup and menu popper */
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    onChange([...currentChips]);
    buildMenu();
  }, [currentChips]);

  React.useEffect(() => {
    buildMenu();
  }, [options]);

  const buildMenu = () => {
    /** in the menu only show items that include the text in the input */
    const filteredMenuItems = options
      .filter(
        (item: string, index: number, arr: string[]) =>
          arr.indexOf(item) === index &&
          !currentChips.has(item) &&
          (!inputValue || item.toLowerCase().includes(inputValue.toLowerCase()))
      )
      .map((currentValue, index) => (
        <MenuItem key={currentValue} itemId={index}>
          {currentValue}
        </MenuItem>
      ));

    /** in the menu show a disabled "no result" when all menu items are filtered out */
    if (filteredMenuItems.length === 0) {
      const noResultItem = (
        <MenuItem isDisabled key="no result">
          {noResultsMessage}
        </MenuItem>
      );
      setMenuItems([noResultItem]);
      setHint("");
      return;
    }

    /** The hint is set whenever there is only one autocomplete option left. */
    if (filteredMenuItems.length === 1 && inputValue.length) {
      const hint = filteredMenuItems[0].props.children;
      if (hint.toLowerCase().indexOf(inputValue.toLowerCase())) {
        // the match was found in a place other than the start, so typeahead wouldn't work right
        setHint("");
      } else {
        // use the input for the first part, otherwise case difference could make things look wrong
        setHint(inputValue + hint.substr(inputValue.length));
      }
    } else {
      setHint("");
    }

    /** add a heading to the menu */
    const headingItem = (
      <MenuItem isDisabled key="heading">
        {menuHeader}
      </MenuItem>
    );

    const divider = <Divider key="divider" />;

    if (menuHeader) {
      setMenuItems([headingItem, divider, ...filteredMenuItems]);
    } else {
      setMenuItems(filteredMenuItems);
    }
  };

  /** callback for updating the inputValue state in this component so that the input can be controlled */
  const handleInputChange = (
    _event: React.FormEvent<HTMLInputElement>,
    value: string
  ) => {
    setInputValue(value);
    buildMenu();
  };

  /** callback for removing a chip from the chip selections */
  const deleteChip = (chipToDelete: string) => {
    const newChips = new Set(currentChips);
    newChips.delete(chipToDelete);
    setCurrentChips(newChips);
  };

  /** add the given string as a chip in the chip group and clear the input */
  const addChip = (newChipText: string) => {
    if (!allowUserOptions) {
      const matchingOption = options.find(
        (o) => o.toLowerCase() === (hint || newChipText).toLowerCase()
      );
      if (!matchingOption) {
        return;
      }
      newChipText = matchingOption;
    }
    setCurrentChips(new Set([...currentChips, newChipText]));
    setInputValue("");
    setMenuIsOpen(false);
  };

  /** add the current input value as a chip */
  const handleEnter = () => {
    if (inputValue.length) {
      addChip(inputValue);
    }
  };

  const handleTab = (event: React.KeyboardEvent) => {
    const firstItemIndex = menuHeader ? 2 : 0;
    // if only 1 item (possibly including menu heading and divider)
    if (menuItems.length === 1 + firstItemIndex) {
      setInputValue(menuItems[firstItemIndex].props.children);
      event.preventDefault();
    }
    setMenuIsOpen(false);
  };

  /** close the menu when escape is hit */
  const handleEscape = () => {
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
  const handleTextInputKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case "Enter":
        handleEnter();
        break;
      case "Escape":
        handleEscape();
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

  /** add the text of the selected item as a new chip */
  const onSelect = (event?: React.MouseEvent<Element, MouseEvent>) => {
    if (!event) {
      return;
    }
    const selectedText = (event.target as HTMLElement).innerText;
    addChip(selectedText);
    event.stopPropagation();
    focusTextInput(true);
  };

  /** close the menu when a click occurs outside of the menu or text input group */
  const handleClick = (event?: MouseEvent) => {
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
  const handleMenuKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case "Tab":
      case "Escape":
        event.preventDefault();
        focusTextInput();
        setMenuIsOpen(false);
        break;
    }
  };

  const inputGroup = (
    <div ref={searchInputRef}>
      <SearchInput
        value={inputValue}
        hint={hint}
        onChange={handleInputChange}
        onClear={() => setInputValue("")}
        onFocus={() => setMenuIsOpen(true)}
        onKeyDown={handleTextInputKeyDown}
        placeholder={placeholderText}
        aria-label={searchInputAriaLabel}
      />
    </div>
  );

  const menu = (
    <Menu
      ref={menuRef}
      onSelect={onSelect}
      onKeyDown={handleMenuKeyDown}
      isScrollable
    >
      <MenuContent>
        <MenuList>{menuItems}</MenuList>
      </MenuContent>
    </Menu>
  );

  return (
    <Flex direction={{ default: "column" }}>
      <FlexItem>
        <Popper
          trigger={inputGroup}
          triggerRef={searchInputRef}
          popper={menu}
          popperRef={menuRef}
          appendTo={() => searchInputRef.current || document.body}
          isVisible={menuIsOpen}
          onDocumentClick={handleClick}
        />
      </FlexItem>
      <FlexItem>
        <Flex spaceItems={{ default: "spaceItemsXs" }}>
          {Array.from(currentChips).map((currentChip) => (
            <FlexItem key={currentChip}>
              <Label color={labelColor} onClose={() => deleteChip(currentChip)}>
                {currentChip}
              </Label>
            </FlexItem>
          ))}
        </Flex>
      </FlexItem>
    </Flex>
  );
};
