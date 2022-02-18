import { useCallback, useReducer } from "react";
import { AxiosPromise } from "axios";
import { ActionType, createAsyncAction, getType } from "typesafe-actions";

export const {
  request: fetchRequest,
  success: fetchSuccess,
  failure: fetchFailure,
} = createAsyncAction(
  "useFetchPagination/fetch/request",
  "useFetchPagination/fetch/success",
  "useFetchPagination/fetch/failure"
)<void, any, any>();

type State = Readonly<{
  isFetching: boolean;
  data?: any;
  fetchError?: any;
  fetchCount: number;
}>;

const defaultState: State = {
  isFetching: false,
  data: undefined,
  fetchError: undefined,
  fetchCount: 0,
};

type Action = ActionType<
  typeof fetchRequest | typeof fetchSuccess | typeof fetchFailure
>;

const initReducer = (isFetching: boolean): State => {
  return {
    ...defaultState,
    isFetching,
  };
};

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case getType(fetchRequest):
      return {
        ...state,
        isFetching: true,
      };
    case getType(fetchSuccess):
      return {
        ...state,
        isFetching: false,
        fetchError: undefined,
        data: action.payload,
        fetchCount: state.fetchCount + 1,
      };
    case getType(fetchFailure):
      return {
        ...state,
        isFetching: false,
        fetchError: action.payload,
        fetchCount: state.fetchCount + 1,
      };
    default:
      return state;
  }
};

export interface IArgs<T, U> {
  defaultIsFetching?: boolean;
  requestFetch: (page: number, pageSize: number) => AxiosPromise<T>;
  continueIf: (
    currentResponseData: T,
    currentPage: number,
    currentPageSize: number
  ) => boolean;
  toArray: (currentResponseData: T) => U[];
}

export interface IState<U> {
  data?: U[];
  isFetching: boolean;
  fetchError?: any;
  fetchCount: number;
  requestFetch: (page: number, pageSize: number) => void;
}

export const useFetchPagination = <T, U>({
  defaultIsFetching = false,
  requestFetch,
  continueIf,
  toArray,
}: IArgs<T, U>): IState<U> => {
  const [state, dispatch] = useReducer(reducer, defaultIsFetching, initReducer);

  const executeFetch = useCallback(
    (page: number, pageSize: number, acumulator: U[]) => {
      requestFetch(page, pageSize)
        .then(({ data }) => {
          const totalData = [...acumulator, ...toArray(data)];
          if (continueIf(data, page, pageSize)) {
            executeFetch(page + 1, pageSize, totalData);
          } else {
            dispatch(fetchSuccess(totalData));
          }
        })
        .catch((error) => {
          dispatch(fetchFailure(error));
        });
    },
    [requestFetch, continueIf, toArray]
  );

  const requestFetchHandler = useCallback(
    (page: number, pageSize: number) => {
      dispatch(fetchRequest());
      executeFetch(page, pageSize, []);
    },
    [executeFetch]
  );

  return {
    data: state.data,
    isFetching: state.isFetching,
    fetchError: state.fetchError,
    fetchCount: state.fetchCount,
    requestFetch: requestFetchHandler,
  };
};

export default useFetchPagination;
