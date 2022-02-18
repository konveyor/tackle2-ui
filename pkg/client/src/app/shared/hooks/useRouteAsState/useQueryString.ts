import { Dispatch, SetStateAction, useCallback, useMemo } from "react";
import { useHistory } from "react-router-dom";

import { encodeValues, objectToQueryParams, removeUndefined } from "./helpers";
import { useDecodedLocation } from "./useDecodedLocation";

type DispatchState<TState> = Dispatch<SetStateAction<TState>>;
type RouteObject = Record<string, string[]>;

export const useQueryString = (
  defaultValues?: RouteObject
): [RouteObject, DispatchState<RouteObject>] => {
  const { pathname, search } = useDecodedLocation();
  const history = useHistory();

  const updateQuery: DispatchState<RouteObject> = useCallback(
    (dispatch: SetStateAction<RouteObject>) => {
      const updatedParams =
        typeof dispatch === "function" ? dispatch(search) : dispatch;
      history.replace(
        pathname + objectToQueryParams(encodeValues(updatedParams))
      );
    },
    [search, pathname, history]
  );

  const queryWithDefault = useMemo(() => {
    return Object.assign({}, defaultValues, removeUndefined(search));
  }, [search, defaultValues]);

  return [queryWithDefault, updateQuery];
};
