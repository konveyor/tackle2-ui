import React from "react";
import { IUseUrlParamsArgs, useUrlParams } from "./useUrlParams";
import {
  UseStorageTypeOptions,
  useLocalStorage,
  useSessionStorage,
} from "@migtools/lib-ui";

type UsePersistedStateOptions<
  T,
  TURLParamKey extends string,
  TKeyPrefix extends string,
> = {
  defaultValue: T;
} & (
  | {
      mode?: "state";
    }
  | ({
      mode: "url";
    } & IUseUrlParamsArgs<TURLParamKey, TKeyPrefix, T>)
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
): [T | null, (value: T) => void] => {
  const storage = {
    state: React.useState(options.defaultValue),
    url: useUrlParams({
      // TODO can we avoid these assertions? how can we narrow the type of `options` depending on mode without conditionals?
      // something with `satisfies`? read TS docs on narrowing types with hints
      ...(options as IUseUrlParamsArgs<TURLParamKey, TKeyPrefix, T>),
      isEnabled: options.mode === "url",
    }),
    localStorage: useLocalStorage({
      ...(options as UseStorageTypeOptions<T>),
      isEnabled: options.mode === "localStorage",
    }),
    sessionStorage: useSessionStorage({
      ...(options as UseStorageTypeOptions<T>),
      isEnabled: options.mode === "sessionStorage",
    }),
  };
  return storage[options.mode || "state"];
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
