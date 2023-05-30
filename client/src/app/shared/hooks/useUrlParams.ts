import { DisallowCharacters } from "@app/utils/type-utils";
import { objectKeys } from "@app/utils/utils";
import React from "react";
import { useLocation, useHistory } from "react-router-dom";
import { IExtraArgsForUrlParamHooks } from "./table-controls";

// useUrlParams is a generic hook similar to React.useState which stores its state in the URL search params string.
// The state is retained on a page reload, when using the browser back/forward buttons, or when bookmarking the page.
// It can be used to store a value of any type (`TDeserializedParams`) in one or more URL params by providing:
// - A list of `urlParamKeys` you want to use for the URL params (strings with any characters except colon ":")
// - A `serialize` function to convert this type into an object with string values (`TSerializedParams`)
// - A `deserialize` function to convert the serialized object back to your state's type
// - An optional `urlParamKeyPrefix` to allow for multiple instances using the same keys on the same page.
// - An optional `renderKey`. When this changes, params will be reset to defaults. If null, all params will be removed.
// The return value is the same [value, setValue] tuple returned by React.useState.

// Note: You do not need to worry about the keyPrefix in your serialize and deserialize functions.
//       The keys of TDeserializedParams and TSerializedParams have the prefixes omitted.
//       Prefixes are only used at the very first/last step when reading/writing from/to the URLSearchParams object.

type TSerializedParams<TUrlParamKey extends string> = Partial<
  Record<TUrlParamKey, string | null>
>;

export interface IUseUrlParamsArgs<
  TUrlParamKey extends string,
  TKeyPrefix extends string,
  TDeserializedParams
> extends IExtraArgsForUrlParamHooks<TKeyPrefix> {
  urlParamKeys: DisallowCharacters<TUrlParamKey, ":">[];
  defaultValue: TDeserializedParams;
  serialize: (
    params: Partial<TDeserializedParams>
  ) => TSerializedParams<TUrlParamKey>;
  deserialize: (
    serializedParams: TSerializedParams<TUrlParamKey>
  ) => TDeserializedParams;
}

export type TUrlParamStateTuple<TDeserializedParams> = readonly [
  TDeserializedParams,
  (newParams: Partial<TDeserializedParams>) => void
];

export const useUrlParams = <
  TUrlParamKey extends string,
  TKeyPrefix extends string,
  TDeserializedParams
>({
  urlParamKeyPrefix,
  urlParamKeys,
  defaultValue,
  serialize,
  deserialize,
  renderKey,
}: IUseUrlParamsArgs<
  TUrlParamKey,
  TKeyPrefix,
  TDeserializedParams
>): TUrlParamStateTuple<TDeserializedParams> => {
  type TPrefixedUrlParamKey = TUrlParamKey | `${TKeyPrefix}:${TUrlParamKey}`;

  const history = useHistory();

  const withPrefix = (key: TUrlParamKey): TPrefixedUrlParamKey =>
    urlParamKeyPrefix ? `${urlParamKeyPrefix}:${key}` : key;

  const withPrefixes = (
    serializedParams: TSerializedParams<TUrlParamKey>
  ): TSerializedParams<TPrefixedUrlParamKey> =>
    urlParamKeyPrefix
      ? objectKeys(serializedParams).reduce(
          (obj, key) => ({
            ...obj,
            [withPrefix(key)]: serializedParams[key],
          }),
          {} as TSerializedParams<TPrefixedUrlParamKey>
        )
      : (serializedParams as TSerializedParams<TPrefixedUrlParamKey>);

  const setParams = (newParams: Partial<TDeserializedParams>) => {
    // In case setParams is called multiple times synchronously from the same rendered instance,
    // we use document.location here as the current params so these calls never overwrite each other.
    // This also retains any unrelated params that might be present and allows newParams to be a partial update.
    const { pathname, search } = document.location;
    const existingSearchParams = new URLSearchParams(search);
    // We prefix the params object here so the serialize function doesn't have to care about the keyPrefix.
    const newPrefixedSerializedParams = withPrefixes(serialize(newParams));
    history.replace({
      pathname,
      search: trimAndStringifyUrlParams({
        existingSearchParams,
        newPrefixedSerializedParams,
      }),
    });
  };

  // We use useLocation here so we are re-rendering when the params change.
  const urlParams = new URLSearchParams(useLocation().search);
  // We un-prefix the params object here so the deserialize function doesn't have to care about the keyPrefix.
  const serializedParams = urlParamKeys.reduce(
    (obj, key) => ({
      ...obj,
      [key]: urlParams.get(withPrefix(key)),
    }),
    {} as TSerializedParams<TUrlParamKey>
  );
  const allParamsEmpty = urlParamKeys.every((key) => !serializedParams[key]);
  const params = allParamsEmpty ? defaultValue : deserialize(serializedParams);

  // On first render, all params will be empty and we want to reset to default params.
  const isInitializedRef = React.useRef(false);
  React.useEffect(() => {
    if (allParamsEmpty && !isInitializedRef.current && renderKey !== null) {
      console.log("INITIAL SET TO DEFAULT!", defaultValue);
      setParams(defaultValue);
      isInitializedRef.current = true;
    }
  }, [allParamsEmpty, renderKey]);

  // If renderKey becomes null, we want to clear all params.
  // If renderKey changes after first render and is non-null, we want to reset to default params.
  React.useEffect(() => {
    if (renderKey === null) {
      console.log("SET TO EMPTY FROM NULL KEY!");
      setParams({});
    } else if (isInitializedRef.current) {
      console.log("SET TO DEFAULT BECAUSE KEY CHANGED!");
      setParams(defaultValue);
    }
  }, [renderKey]);

  return [params, setParams];
};

export const trimAndStringifyUrlParams = <TPrefixedUrlParamKey extends string>({
  existingSearchParams = new URLSearchParams(),
  newPrefixedSerializedParams,
}: {
  existingSearchParams?: URLSearchParams;
  newPrefixedSerializedParams: TSerializedParams<TPrefixedUrlParamKey>;
}) => {
  const existingPrefixedSerializedParams =
    Object.fromEntries(existingSearchParams);
  objectKeys(newPrefixedSerializedParams).forEach((key) => {
    // Returning undefined for a property from serialize should result in it being omitted from the partial update.
    if (newPrefixedSerializedParams[key] === undefined) {
      delete newPrefixedSerializedParams[key];
    }
    // Returning null for a property from serialize should result in it being removed from the URL.
    if (newPrefixedSerializedParams[key] === null) {
      delete newPrefixedSerializedParams[key];
      delete existingPrefixedSerializedParams[key];
    }
  });
  const newParams = new URLSearchParams({
    ...existingPrefixedSerializedParams,
    ...newPrefixedSerializedParams,
  });
  newParams.sort();
  return newParams.toString();
};
