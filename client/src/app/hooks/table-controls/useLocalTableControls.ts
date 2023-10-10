import { useLocalTableControlState } from "./useLocalTableControlState";
import { useTableControlProps } from "./useTableControlProps";
import { IUseLocalTableControlStateArgs } from "./types";

export const useLocalTableControls = <
  TItem,
  TColumnKey extends string,
  TSortableColumnKey extends TColumnKey,
  TFilterCategoryKey extends string = string,
  TPersistenceKeyPrefix extends string = string,
>(
  args: IUseLocalTableControlStateArgs<
    TItem,
    TColumnKey,
    TSortableColumnKey,
    TFilterCategoryKey,
    TPersistenceKeyPrefix
  >
) => useTableControlProps(useLocalTableControlState(args));
