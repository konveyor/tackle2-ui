import React, { useEffect } from "react";
import { ToolbarChip } from "@patternfly/react-core";

import { useQueryString, useToolbarFilter } from "@app/shared/hooks";
import { ChipBusinessService, ChipTag } from "@app/shared/containers";

import { ApplicationFilterKey } from "@app/Constants";

export interface IState {
  filters: Map<string, ToolbarChip[]>;
  isPresent: boolean;
  addFilter: (key: string, value: ToolbarChip) => void;
  setFilter: (key: string, value: ToolbarChip[]) => void;
  removeFilter: (key: string, value: ToolbarChip | ToolbarChip[]) => void;
  clearAllFilters: () => void;
}

export const useApplicationToolbarFilter = (): IState => {
  // Router
  const [queryParams, updateParams] = useQueryString();

  // Toolbar filters
  const { filters, ...rest } = useToolbarFilter<ToolbarChip>(() => {
    const initialValue = new Map<ApplicationFilterKey, ToolbarChip[]>();

    Object.keys(queryParams).forEach((key) => {
      const filterKey = key as ApplicationFilterKey;
      switch (filterKey) {
        case ApplicationFilterKey.NAME:
        case ApplicationFilterKey.DESCRIPTION:
          initialValue.set(
            filterKey,
            queryParams[key].map((q) => ({ key: q, node: q }))
          );
          break;
        case ApplicationFilterKey.BUSINESS_SERVICE:
          initialValue.set(
            filterKey,
            queryParams[key].map((elem) => ({
              key: elem,
              node: <ChipBusinessService id={elem} />,
            }))
          );
          break;
        case ApplicationFilterKey.TAG:
          initialValue.set(
            filterKey,
            queryParams[key].map((elem) => ({
              key: elem,
              node: <ChipTag id={elem} />,
            }))
          );
          break;
      }
    });

    return initialValue;
  });

  useEffect(() => {
    const result: Record<string, string[]> = {};
    Array.from(filters.entries()).forEach((entry) => {
      const filterKey = entry[0];
      const filterValue = entry[1];
      result[filterKey] = filterValue.map((f) => f.key);
    });
    updateParams(result);
  }, [filters, updateParams]);

  return {
    filters,
    ...rest,
  };
};

export default useApplicationToolbarFilter;
