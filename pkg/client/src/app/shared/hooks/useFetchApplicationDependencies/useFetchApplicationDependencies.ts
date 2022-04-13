import { useCallback, useReducer } from "react";
import { AxiosError } from "axios";
import { ActionType, createAsyncAction, getType } from "typesafe-actions";

import { getApplicationDependencies } from "@app/api/rest";
import { PageRepresentation, ApplicationDependency } from "@app/api/models";

export const {
  request: fetchRequest,
  success: fetchSuccess,
  failure: fetchFailure,
} = createAsyncAction(
  "useFetchApplicationDependencies/fetch/request",
  "useFetchApplicationDependencies/fetch/success",
  "useFetchApplicationDependencies/fetch/failure"
)<void, ApplicationDependency[], AxiosError>();

type State = Readonly<{
  isFetching: boolean;
  applicationDependencies?: ApplicationDependency[];
  fetchError?: AxiosError;
  fetchCount: number;
}>;

const defaultState: State = {
  isFetching: false,
  applicationDependencies: undefined,
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
        applicationDependencies: action.payload,
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

export interface IState {
  applicationDependencies?: ApplicationDependency[];
  isFetching: boolean;
  fetchError?: AxiosError;
  fetchCount: number;
  fetchAllApplicationDependencies: (filters: {
    from?: string[];
    to?: string[];
  }) => void;
}

export const useFetchApplicationDependencies = (
  defaultIsFetching: boolean = false
): IState => {
  const [state, dispatch] = useReducer(reducer, defaultIsFetching, initReducer);

  const fetchAllApplicationDependencies = useCallback(
    (filters: { from?: string[]; to?: string[] }) => {
      dispatch(fetchRequest());

      getApplicationDependencies()
        .then(({ data }) => {
          dispatch(fetchSuccess(data));
        })
        .catch((error: AxiosError) => {
          dispatch(fetchFailure(error));
        });
    },
    []
  );

  return {
    applicationDependencies: state.applicationDependencies,
    isFetching: state.isFetching,
    fetchError: state.fetchError,
    fetchCount: state.fetchCount,
    fetchAllApplicationDependencies,
  };
};

export default useFetchApplicationDependencies;
