import React, { useState } from "react";

import { InputGroup } from "@patternfly/react-core";
import { SimpleFilterDropdown } from "@app/shared/components";

interface FilterOption {
  key: string;
  name: React.ReactNode;
  input: React.ReactNode;
}

export interface IToolbarSearchFilterProps {
  filters: FilterOption[];
}

export const ToolbarSearchFilter: React.FC<IToolbarSearchFilterProps> = ({
  filters,
}) => {
  const [selectedKey, setSelectedKey] = useState<string | undefined>(
    filters.length > 0 ? filters[0].key : undefined
  );

  const selectedFilter = filters.find((f) => f.key === selectedKey);

  return (
    <InputGroup>
      <SimpleFilterDropdown
        label={selectedFilter?.name}
        options={filters.map((f) => ({ key: f.key, name: f.name }))}
        onSelect={(dropdown) => setSelectedKey(dropdown.key)}
      />
      {selectedFilter?.input}
    </InputGroup>
  );
};
