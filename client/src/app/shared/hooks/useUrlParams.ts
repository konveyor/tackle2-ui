import React from "react";
import { useLocation, useHistory } from "react-router-dom";

export interface IUseUrlParamsArgs<
  TUrlParamKey extends string,
  TDeserializedParams
> {
  keys: TUrlParamKey[];
  defaultParams: TDeserializedParams;
  serialize: (
    params: Partial<TDeserializedParams>
  ) => Partial<Record<TUrlParamKey, string>>;
  deserialize: (
    urlParams: Partial<Record<TUrlParamKey, string>>
  ) => TDeserializedParams;
}

export const useUrlParams = <TUrlParamKey extends string, TDeserializedParams>({
  keys,
  defaultParams,
  serialize,
  deserialize,
}: IUseUrlParamsArgs<TUrlParamKey, TDeserializedParams>) => {
  const history = useHistory();

  const setParams = (newParams: Partial<TDeserializedParams>) => {
    // In case setParams is called multiple times synchronously from the same rendered instance,
    // we use document.location here as the current params so these calls never overwrite each other.
    // This also retains any unrelated params that might be present and allows newParams to be a partial update.
    const { pathname, search } = document.location;
    history.replace({
      pathname,
      search: new URLSearchParams({
        ...Object.fromEntries(new URLSearchParams(search)),
        ...serialize(newParams),
      }).toString(),
    });
  };

  // We use useLocation here so we are re-rendering when the params change
  const urlParams = new URLSearchParams(useLocation().search);
  const serializedParams = keys.reduce(
    (obj, key) => ({ ...obj, [key]: urlParams.get(key) }),
    {} as Partial<Record<TUrlParamKey, string>>
  );
  const allParamsEmpty = keys.every((key) => !serializedParams[key]);
  const params = allParamsEmpty ? defaultParams : deserialize(serializedParams);

  React.useEffect(() => {
    if (allParamsEmpty) setParams(defaultParams);
  }, [allParamsEmpty]);

  return { params, setParams };
};
