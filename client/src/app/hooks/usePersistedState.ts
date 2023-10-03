import React from "react";
import { IUseUrlParamsArgs, useUrlParams } from "./useUrlParams";
import {
  UseStorageTypeOptions,
  useLocalStorage,
  useSessionStorage,
} from "@migtools/lib-ui";

export type BaseUsePersistedStateOptions<
  TPersistedState,
  TPersistenceKeyPrefix extends string = string,
> = {
  defaultValue: TPersistedState;
  isEnabled?: boolean;
  persistenceKeyPrefix?: TPersistenceKeyPrefix;
};

export type UsePersistedStateOptions<
  TPersistedState,
  TPersistenceKeyPrefix extends string,
  TURLParamKey extends string,
> = BaseUsePersistedStateOptions<TPersistedState> &
  (
    | {
        persistTo?: "state";
      }
    | ({
        persistTo: "urlParams";
      } & IUseUrlParamsArgs<
        TPersistedState,
        TPersistenceKeyPrefix,
        TURLParamKey
      >)
    | ({
        persistTo: "localStorage" | "sessionStorage";
      } & UseStorageTypeOptions<TPersistedState>)
  );

export const usePersistedState = <
  TPersistedState,
  TPersistenceKeyPrefix extends string,
  TURLParamKey extends string,
>(
  options: UsePersistedStateOptions<
    TPersistedState,
    TPersistenceKeyPrefix,
    TURLParamKey
  >
): [TPersistedState, (value: TPersistedState) => void] => {
  const {
    defaultValue,
    isEnabled = true,
    persistTo,
    persistenceKeyPrefix,
  } = options;
  const urlParamOptions = options as IUseUrlParamsArgs<
    TPersistedState,
    TPersistenceKeyPrefix,
    TURLParamKey
  >;
  const storageOptions = options as UseStorageTypeOptions<TPersistedState>;
  const prefixedStorageKey = persistenceKeyPrefix
    ? `${persistenceKeyPrefix}:${storageOptions.key}`
    : storageOptions.key;
  const persistence = {
    state: React.useState(defaultValue),
    urlParams: useUrlParams({
      ...urlParamOptions,
      isEnabled: isEnabled && persistTo === "urlParams",
    }),
    localStorage: useLocalStorage({
      ...storageOptions,
      isEnabled: isEnabled && persistTo === "localStorage",
      key: prefixedStorageKey,
    }),
    sessionStorage: useSessionStorage({
      ...(options as UseStorageTypeOptions<TPersistedState>),
      isEnabled: isEnabled && persistTo === "sessionStorage",
      key: prefixedStorageKey,
    }),
  };
  return persistence[persistTo || "state"];
};

// TODO combine all the use[Feature]State and use[Feature]UrlParams hooks
// TODO search for and make sure there are no more hooks with "urlParams" in the name
// TODO TEST IT - should build and work at this point
// TODO bring in useSelectionState as a persistable thing
// TODO add JSdoc comments for all inputs and outputs
// TODO explore the state contract needed for using useTableControlProps with custom state logic
// TODO rename args to options in all types and code
// TODO rename active-row to active-item
// TODO decouple SimplePagination
// TODO decouple FilterToolbar?  -- can we make a toolbar-batteries hook? useFilterToolbar? option to hook it up to table batteries or not?
// TODO decouple useUrlParams from react-router? can we do everything from the document.location.search?
