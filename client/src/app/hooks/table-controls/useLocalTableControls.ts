import {
  useLocalTableControlState,
  useLocalTableControlUrlParams,
} from "./useLocalTableControlState";
import { useTableControlProps } from "./useTableControlProps";
import {
  IExtraArgsForURLParamHooks,
  IUseLocalTableControlStateArgs,
} from "./types";

export const useLocalTableControls = <
  TItem,
  TColumnKey extends string,
  TSortableColumnKey extends TColumnKey,
>(
  args: IUseLocalTableControlStateArgs<TItem, TColumnKey, TSortableColumnKey>
) => useTableControlProps(useLocalTableControlState(args));

export const useLocalTableControlsWithUrlParams = <
  TItem,
  TColumnKey extends string,
  TSortableColumnKey extends TColumnKey,
  TURLParamKeyPrefix extends string = string,
>(
  args: IUseLocalTableControlStateArgs<TItem, TColumnKey, TSortableColumnKey> &
    IExtraArgsForURLParamHooks<TURLParamKeyPrefix>
) => useTableControlProps(useLocalTableControlUrlParams(args));
