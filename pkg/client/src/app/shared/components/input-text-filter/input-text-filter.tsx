import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button, InputGroup, TextInput } from "@patternfly/react-core";
import { SearchIcon } from "@patternfly/react-icons/dist/esm/icons/search-icon";

export interface InputTextFilterProps {
  onApplyFilter: (filterText: string) => void;
}

export const InputTextFilter: React.FC<InputTextFilterProps> = ({
  onApplyFilter,
}) => {
  const { t } = useTranslation();

  const [filterText, setFilterText] = useState("");

  const handleOnChangeFilterText = (value: string) => {
    setFilterText(value);
  };

  const handleOnSearch = () => {
    if (filterText.trim().length > 0) {
      onApplyFilter(filterText.trim());
      setFilterText("");
    }
  };

  const handleOnSearchKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      handleOnSearch();
    }
  };

  return (
    <InputGroup>
      <TextInput
        type="text"
        value={filterText}
        onChange={handleOnChangeFilterText}
        onKeyPress={handleOnSearchKeyPress}
        placeholder={t("terms.filter")}
        aria-label="filter-text"
      />
      <Button variant="control" aria-label="search" onClick={handleOnSearch}>
        <SearchIcon />
      </Button>
    </InputGroup>
  );
};
