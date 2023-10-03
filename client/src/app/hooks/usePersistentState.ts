import React from "react";
import { IUseUrlParamsArgs, useUrlParams } from "./useUrlParams";
import {
  UseStorageTypeOptions,
  useLocalStorage,
  useSessionStorage,
} from "@migtools/lib-ui";

export type BaseUsePersistentStateOptions<
  TValue,
  TPersistenceKeyPrefix extends string = string,
> = {
  defaultValue: TValue;
  isEnabled?: boolean;
  persistenceKeyPrefix?: TPersistenceKeyPrefix;
};

export type UsePersistentStateOptions<
  TValue,
  TPersistenceKeyPrefix extends string,
  TURLParamKey extends string,
> = BaseUsePersistentStateOptions<TValue> &
  (
    | {
        persistTo?: "state";
      }
    | ({
        persistTo: "urlParams";
      } & IUseUrlParamsArgs<TValue, TPersistenceKeyPrefix, TURLParamKey>)
    | ({
        persistTo: "localStorage" | "sessionStorage";
      } & UseStorageTypeOptions<TValue>)
  );

export const usePersistentState = <
  TValue,
  TPersistenceKeyPrefix extends string,
  TURLParamKey extends string,
>(
  options: UsePersistentStateOptions<
    TValue,
    TPersistenceKeyPrefix,
    TURLParamKey
  >
): [TValue, (value: TValue) => void] => {
  const {
    defaultValue,
    isEnabled = true,
    persistTo,
    persistenceKeyPrefix,
  } = options;
  const urlParamOptions = options as IUseUrlParamsArgs<
    TValue,
    TPersistenceKeyPrefix,
    TURLParamKey
  >;
  const storageOptions = options as UseStorageTypeOptions<TValue>;
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
      ...(options as UseStorageTypeOptions<TValue>),
      isEnabled: isEnabled && persistTo === "sessionStorage",
      key: prefixedStorageKey,
    }),
  };
  return persistence[persistTo || "state"];
};
