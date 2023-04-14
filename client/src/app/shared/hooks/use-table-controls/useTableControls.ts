import {
  UseTableControlStateArgs,
  useTableControlState,
} from "./useTableControlState";
import {
  UseTableControlPropsAdditionalArgs,
  useTableControlProps,
} from "./useTableControlProps";

export type UseTableControlsArgs<
  TItem extends { name: string },
  TColumnKey extends string,
  TSortableColumnKey extends TColumnKey // A subset of column keys as a separate narrower type
> = UseTableControlStateArgs<TItem, TColumnKey, TSortableColumnKey> &
  UseTableControlPropsAdditionalArgs;

export const useTableControls = <
  TItem extends { name: string },
  TColumnKey extends string,
  TSortableColumnKey extends TColumnKey
>(
  args: UseTableControlsArgs<TItem, TColumnKey, TSortableColumnKey>
) => {
  const stateReturnValues = useTableControlState(args);
  const propsReturnValues = useTableControlProps({
    ...args,
    ...stateReturnValues,
  });
  return { ...stateReturnValues, ...propsReturnValues };
};
