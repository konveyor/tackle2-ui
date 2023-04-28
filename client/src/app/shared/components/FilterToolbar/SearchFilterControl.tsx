import * as React from "react";
import {
  ToolbarFilter,
  InputGroup,
  TextInput,
  Button,
  ButtonVariant,
} from "@patternfly/react-core";
import SearchIcon from "@patternfly/react-icons/dist/esm/icons/search-icon";
import { IFilterControlProps } from "./FilterControl";
import { ISearchFilterCategory } from "./FilterToolbar";

export interface ISearchFilterControlProps<
  TItem,
  TFilterCategoryKey extends string
> extends IFilterControlProps<TItem, TFilterCategoryKey> {
  category: ISearchFilterCategory<TItem, TFilterCategoryKey>;
}

export const SearchFilterControl = <TItem, TFilterCategoryKey extends string>({
  category,
  filterValue,
  setFilterValue,
  showToolbarItem,
}: React.PropsWithChildren<
  ISearchFilterControlProps<TItem, TFilterCategoryKey>
>): JSX.Element | null => {
  // Keep internal copy of value until submitted by user
  const [inputValue, setInputValue] = React.useState(filterValue?.[0] || "");
  // Update it if it changes externally
  React.useEffect(() => {
    setInputValue(filterValue?.[0] || "");
  }, [filterValue]);

  const onFilterSubmit = () => setFilterValue(inputValue ? [inputValue] : []);

  const id = `${category.key}-input`;
  return (
    <ToolbarFilter
      chips={filterValue || []}
      deleteChip={() => setFilterValue([])}
      categoryName={category.title}
      showToolbarItem={showToolbarItem}
    >
      <InputGroup>
        <TextInput
          name={id}
          id={id}
          type="search"
          aria-label={`${category.title} filter`}
          onChange={setInputValue}
          value={inputValue}
          placeholder={category.placeholderText}
          onKeyDown={(event: React.KeyboardEvent) => {
            if (event.key && event.key !== "Enter") return;
            onFilterSubmit();
          }}
        />
        <Button
          variant={ButtonVariant.control}
          id="search-button"
          aria-label="search button for search input"
          onClick={onFilterSubmit}
        >
          <SearchIcon />
        </Button>
      </InputGroup>
    </ToolbarFilter>
  );
};
