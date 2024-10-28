import React from "react";
import { IUseUrlParamsArgs, useUrlParams } from "./useUrlParams";
import {
  UseStorageTypeOptions,
  useLocalStorage,
  useSessionStorage,
} from "@migtools/lib-ui";
import { DisallowCharacters } from "@app/utils/type-utils";

type PersistToStateOptions = { persistTo?: "state" };

type PersistToProvider<TValue> = {
  persistTo: "provider";
  defaultValue: TValue;
  isEnabled?: boolean;
  serialize: (params: TValue) => void;
  deserialize: () => TValue;
};

export type PersistToUrlParamsOptions<
  TValue,
  TPersistenceKeyPrefix extends string,
  TURLParamKey extends string,
> = {
  persistTo: "urlParams";
} & IUseUrlParamsArgs<TValue, TPersistenceKeyPrefix, TURLParamKey>;

type PersistToStorageOptions<TValue> = {
  persistTo: "localStorage" | "sessionStorage";
} & UseStorageTypeOptions<TValue>;

export type UsePersistentStateOptions<
  TValue,
  TPersistenceKeyPrefix extends string,
  TURLParamKey extends string,
> = {
  defaultValue: TValue;
  isEnabled?: boolean;
  persistenceKeyPrefix?: DisallowCharacters<TPersistenceKeyPrefix, ":">;
} & (
  | PersistToStateOptions
  | PersistToUrlParamsOptions<TValue, TPersistenceKeyPrefix, TURLParamKey>
  | PersistToStorageOptions<TValue>
  | PersistToProvider<TValue>
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
    persistTo,
    persistenceKeyPrefix,
    isEnabled = true,
  } = options;

  const isUrlParamsOptions = (
    o: typeof options
  ): o is PersistToUrlParamsOptions<
    TValue,
    TPersistenceKeyPrefix,
    TURLParamKey
  > => o.persistTo === "urlParams";

  const isStorageOptions = (
    o: typeof options
  ): o is PersistToStorageOptions<TValue> =>
    o.persistTo === "localStorage" || o.persistTo === "sessionStorage";

  const prefixKey = (key: string) =>
    persistenceKeyPrefix ? `${persistenceKeyPrefix}:${key}` : key;

  const persistence = {
    state: React.useState(defaultValue),
    urlParams: useUrlParams(
      isUrlParamsOptions(options)
        ? options
        : {
            ...options,
            isEnabled: false,
            keys: [],
            serialize: () => ({}),
            deserialize: () => defaultValue,
          }
    ),
    localStorage: useLocalStorage(
      isStorageOptions(options)
        ? { ...options, key: prefixKey(options.key) }
        : { ...options, isEnabled: false, key: "" }
    ),
    sessionStorage: useSessionStorage(
      isStorageOptions(options)
        ? { ...options, key: prefixKey(options.key) }
        : { ...options, isEnabled: false, key: "" }
    ),
    provider: usePersistenceProvider<TValue>(
      isPersistenceProviderOptions(options)
        ? options
        : {
            serialize: () => {},
            deserialize: () => defaultValue,
            defaultValue,
            isEnabled: false,
            persistTo: "provider",
          }
    ),
  };
  const [value, setValue] = persistence[persistTo || "state"];
  return isEnabled ? [value, setValue] : [defaultValue, () => {}];
};

const usePersistenceProvider = <TValue>({
  serialize,
  deserialize,
  defaultValue,
}: PersistToProvider<TValue>): [TValue, (val: TValue) => void] => {
  // use default value if nulish value was deserialized
  return [deserialize() ?? defaultValue, serialize];
};

export const isPersistenceProviderOptions = <
  TValue,
  TPersistenceKeyPrefix extends string,
  TURLParamKey extends string,
>(
  o: Partial<
    UsePersistentStateOptions<TValue, TPersistenceKeyPrefix, TURLParamKey>
  >
): o is PersistToProvider<TValue> => o.persistTo === "provider";
