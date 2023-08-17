import React from "react";
import {
  Label,
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
  options?: string[];
  value?: string;
  labelColor?:
    | "blue"
    | "cyan"
    | "green"
    | "orange"
    | "purple"
    | "red"
    | "grey"
    | "gold"
    | undefined;
  selections?: string[];
}

export const Autocomplete: React.FC<IAutocompleteProps> = ({
  // TODO: data just for testing purposes, should be removed
  options = ["Cluster", "Kind", "Label", "Name", "Namespace", "Status"],
  value,
  labelColor,
  selections = [],
}) => {
  const [inputValue, setInputValue] = React.useState(value || "");
  const [menuIsOpen, setMenuIsOpen] = React.useState(false);
  const [currentChips, setCurrentChips] = React.useState<string[]>(
    selections || []
  );
  const [hint, setHint] = React.useState("");
  const [menuItems, setMenuItems] = React.useState<React.ReactElement[]>([]);

  /** refs used to detect when clicks occur inside vs outside of the textInputGroup and menu popper */
  const menuRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  /** callback for updating the inputValue state in this component so that the input can be controlled */
  const handleInputChange = (
    _event: React.FormEvent<HTMLInputElement>,
    value: string
  ) => {
    setInputValue(value);
  };

  /** callback for removing a chip from the chip selections */
  const deleteChip = (chipToDelete: string) => {
    const newChips = currentChips.filter(
      (chip) => !Object.is(chip, chipToDelete)
    );
    setCurrentChips(newChips);
  };

  React.useEffect(() => {
    /** in the menu only show items that include the text in the input */
    const filteredMenuItems = options
      .filter(
        (item: string) =>
          !inputValue ||
          item.toLowerCase().includes(inputValue.toString().toLowerCase())
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
          No results found
        </MenuItem>
      );
      setMenuItems([noResultItem]);
      setHint("");
      return;
    }

    /** The hint is set whenever there is only one autocomplete option left. */
    if (filteredMenuItems.length === 1) {
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
        Suggestions
      </MenuItem>
    );

    const divider = <Divider key="divider" />;

    setMenuItems([headingItem, divider, ...filteredMenuItems]);
  }, [inputValue]);

  /** add the given string as a chip in the chip group and clear the input */
  const addChip = (newChipText: string) => {
    setCurrentChips([...currentChips, `${newChipText}`]);
    setInputValue("");
    setMenuIsOpen(false);
  };

  /** add the current input value as a chip */
  const handleEnter = () => {
    if (inputValue.length) {
      addChip(inputValue);
    }
  };

  const handleTab = () => {
    if (menuItems.length === 3) {
      setInputValue(menuItems[2].props.children);
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
      firstElement && firstElement.focus();
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
        handleTab();
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
    console.log("click", event);
    if (!event) {
      return;
    }
    if (searchInputRef.current?.contains(event.target as HTMLElement)) {
      setMenuIsOpen(true);
    } else if (
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
      case "Enter":
      case " ":
        setTimeout(() => setMenuIsOpen(false), 0);
        break;
    }
  };

  const inputGroup = (
    <div ref={searchInputRef}>
      <SearchInput
        value={inputValue}
        hint={hint}
        id="searchInputId"
        onChange={handleInputChange}
        onFocus={() => setMenuIsOpen(true)}
        onKeyDown={handleTextInputKeyDown}
        placeholder="search"
        aria-label="Search input"
      ></SearchInput>
    </div>
  );

  const menu = (
    <div ref={menuRef}>
      <Menu onSelect={onSelect} onKeyDown={handleMenuKeyDown}>
        <MenuContent>
          <MenuList>{menuItems}</MenuList>
        </MenuContent>
      </Menu>
    </div>
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
          {currentChips.map((currentChip) => (
            <FlexItem>
              <Label
                color={labelColor}
                key={currentChip}
                onClose={() => deleteChip(currentChip)}
              >
                {currentChip}
              </Label>
            </FlexItem>
          ))}
        </Flex>
      </FlexItem>
    </Flex>
  );
};
