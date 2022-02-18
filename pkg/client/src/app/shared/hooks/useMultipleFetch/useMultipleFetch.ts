import { useCallback, useReducer } from "react";
import { AxiosPromise } from "axios";
import { ActionType, createAsyncAction, getType } from "typesafe-actions";

interface IFetchData<K = any, T = any> {
  id: K;
  data: T;
}

interface IFetchError<K = any> {
  id: K;
  error: any;
}

export const {
  request: fetchRequest,
  success: fetchSuccess,
  failure: fetchFailure,
} = createAsyncAction(
  "useMultipleFetch/fetch/request",
  "useMultipleFetch/fetch/success",
  "useMultipleFetch/fetch/failure"
)<any[], IFetchData, IFetchError>();

interface State<K = any, T = any> {
  isFetching: Map<K, boolean>;
  data: Map<K, T>;
  fetchError: Map<K, any | undefined>;
  fetchCount: Map<K, number>;
}

const defaultState: State = {
  isFetching: new Map(),
  data: new Map(),
  fetchError: new Map(),
  fetchCount: new Map(),
};

type Action = ActionType<
  typeof fetchRequest | typeof fetchSuccess | typeof fetchFailure
>;

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case getType(fetchRequest):
      return {
        ...state,
        isFetching: action.payload.reduce((reducer, id) => {
          return reducer.set(id, true);
        }, new Map(state.isFetching)),
        fetchCount: action.payload.reduce((reducer, id) => {
          return reducer.set(id, (state.fetchCount.get(id) || 0) + 1);
        }, new Map(state.isFetching)),
      };
    case getType(fetchSuccess):
      return {
        ...state,
        isFetching: new Map(state.isFetching).set(action.payload.id, false),
        fetchError: new Map(state.fetchError).set(action.payload.id, undefined),
        data: new Map(state.data).set(action.payload.id, action.payload.data),
      };
    case getType(fetchFailure):
      return {
        ...state,
        isFetching: new Map(state.isFetching).set(action.payload.id, false),
        fetchError: new Map(state.fetchError).set(
          action.payload.id,
          action.payload.error
        ),
      };
    default:
      return state;
  }
};

export interface IArgs<T, K> {
  onFetch?: (id: K) => AxiosPromise<T>;
  onFetchPromise?: (id: K) => Promise<T>;
}

export interface IState<K, T> {
  getData: (id: K) => T | undefined;
  isFetching: (id: K) => boolean;
  fetchError: (id: K) => any | undefined;
  fetchCount: (id: K) => number;

  triggerFetch: (ids: K[]) => void;
}

export const useMultipleFetch = <K, T>({
  onFetch,
  onFetchPromise,
}: IArgs<T, K>): IState<K, T> => {
  const [state, dispatch] = useReducer(reducer, defaultState);

  const getData = (id: K) => {
    return state.data.get(id);
  };

  const isFetching = (id: K) => {
    return state.isFetching.get(id) || false;
  };

  const fetchError = (id: K) => {
    return state.fetchError.get(id);
  };

  const fetchCount = (id: K) => {
    return state.fetchCount.get(id) || 0;
  };

  const triggerFetch = useCallback(
    (ids: K[]) => {
      dispatch(fetchRequest(ids));

      ids.forEach((id) => {
        let promise;
        if (onFetch) {
          promise = onFetch(id).then(({ data }) => {
            dispatch(fetchSuccess({ id, data }));
          });
        } else if (onFetchPromise) {
          promise = onFetchPromise(id).then((data) => {
            dispatch(fetchSuccess({ id, data }));
          });
        } else {
          return;
        }

        promise.catch((error: any) => {
          dispatch(fetchFailure({ id, error }));
        });
      });
    },
    [onFetch, onFetchPromise]
  );

  return {
    getData,
    isFetching,
    fetchError,
    fetchCount,
    triggerFetch,
  };
};

export default useMultipleFetch;
