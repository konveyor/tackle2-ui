import * as React from "react";
import { useUrlParams } from "../../useUrlParams";
import { DisallowCharacters } from "@app/utils/type-utils";

export interface IActiveRowState {
  activeRowId: string | null;
  setActiveRowId: (id: string | null) => void;
}

export const useActiveRowState = (): IActiveRowState => {
  const [activeRowId, setActiveRowId] = React.useState<string | null>(null);
  return { activeRowId, setActiveRowId };
};

export const useActiveRowUrlParams = <
  TURLParamKeyPrefix extends string = string
>({
  urlParamKeyPrefix,
}: {
  urlParamKeyPrefix?: DisallowCharacters<TURLParamKeyPrefix, ":">;
} = {}): IActiveRowState => {
  const [activeRowId, setActiveRowId] = useUrlParams({
    keyPrefix: urlParamKeyPrefix,
    keys: ["activeRow"],
    defaultValue: null as string | null,
    serialize: (activeRowId) => ({ activeRow: activeRowId || null }),
    deserialize: ({ activeRow }) => activeRow || null,
  });
  return { activeRowId, setActiveRowId };
};
