import React from "react";
import { useUrlParams } from "./useUrlParams";
import { useLocalStorage, useSessionStorage } from "@migtools/lib-ui";

export const usePersistedState = <T>(
  initialValue: T
): [T | undefined, React.Dispatch<React.SetStateAction<T | undefined>>] => {
  const storage = {
    state: React.useState(initialValue),
    url: useUrlParams(), // TODO
    localStorage: useLocalStorage(), // TODO
    sessionStorage: useSessionStorage(), // TODO
  };
  // TODO based on options, return only one of the above?
  // TODO make sure none of the disabled ones have any effect on URL or storage
};

// TODO combine all the use[Feature]State and use[Feature]UrlParams hooks
// TODO combine/rename useTableControlUrlParams into single useTableControlState hook with persistence options
// TODO bring in useSelectionState as a persistable thing
// TODO add JSdoc comments for all inputs and outputs
// TODO explore the state contract needed for using useTableControlProps with custom state logic
// TODO rename args to options in all types and code
// TODO rename active-row to active-item
// TODO decouple SimplePagination
// TODO decouple FilterToolbar?  -- can we make a toolbar-batteries hook? useFilterToolbar? option to hook it up to table batteries or not?
