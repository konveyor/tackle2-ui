import { useTableControlState } from "./useTableControlState";
import { useTableControlProps } from "./useTableControlProps";
import { IUseTableControlStateArgs } from "./types";

export const useTableControls = <
  TItem extends { name: string },
  TColumnKey extends string,
  TSortableColumnKey extends TColumnKey
>(
  args: IUseTableControlStateArgs<TItem, TColumnKey, TSortableColumnKey>
) => useTableControlProps(useTableControlState(args));
