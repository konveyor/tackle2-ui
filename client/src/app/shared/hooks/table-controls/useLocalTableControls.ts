import { useLocalTableControlState } from "./useLocalTableControlState";
import { useTableControlProps } from "./useTableControlProps";
import { IUseTableControlStateArgs } from "./types";

export const useLocalTableControls = <
  TItem extends { name: string },
  TColumnKey extends string,
  TSortableColumnKey extends TColumnKey
>(
  args: IUseTableControlStateArgs<TItem, TColumnKey, TSortableColumnKey>
) => useTableControlProps(useLocalTableControlState(args));
