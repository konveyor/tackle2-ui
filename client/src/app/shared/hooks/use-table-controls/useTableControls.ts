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
  TColumnNames extends Record<string, string>
> = UseTableControlStateArgs<TItem, TColumnNames> &
  UseTableControlPropsAdditionalArgs;

export const useTableControls = <
  TItem extends { name: string },
  TColumnNames extends Record<string, string>
>(
  args: UseTableControlsArgs<TItem, TColumnNames>
) => {
  const stateReturnValues = useTableControlState(args);
  const propsReturnValues = useTableControlProps({
    ...args,
    ...stateReturnValues,
  });
  return { ...stateReturnValues, ...propsReturnValues };
};
