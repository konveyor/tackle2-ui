import React from "react";
import { TSerializedParams, useUrlParams } from "./useUrlParams";
import { useLocalStorage, useSessionStorage } from "@migtools/lib-ui";
import { DisallowCharacters } from "@app/utils/type-utils";

type UsePersistedStateOptions<
  T,
  TURLParamKey extends string,
  TKeyPrefix extends string,
> = {
  defaultValue: T;
} & (
  | {
      mode: null;
    }
  | {
      mode: "url";
      keyPrefix?: DisallowCharacters<TKeyPrefix, ":">;
      keys: DisallowCharacters<TURLParamKey, ":">[];
      serialize: (params: Partial<T>) => TSerializedParams<TURLParamKey>;
      deserialize: (serializedParams: TSerializedParams<TURLParamKey>) => T;
    }
  | {
      mode: "localStorage" | "sessionStorage";
      key: string;
    }
);

export const usePersistedState = <
  T,
  TURLParamKey extends string,
  TKeyPrefix extends string,
>(
  options: UsePersistedStateOptions<T, TURLParamKey, TKeyPrefix>
): [T, (value: T) => void] => {
  const storage = {
    state: React.useState(options.defaultValue),
    url: useUrlParams(options), // TODO - add a disabled flag for the url param behavior?
    localStorage: useLocalStorage(options.key, options.defaultValue), // TODO
    sessionStorage: useSessionStorage(options.key, options.defaultValue), // TODO
  };
  if (!options.mode) return storage.state;
  return storage[options.mode];

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
// TODO decouple useUrlParams from react-router? can we do everything from the document.location.search?
