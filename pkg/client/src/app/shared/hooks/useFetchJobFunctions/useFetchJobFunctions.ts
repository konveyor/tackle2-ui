import { useCallback, useReducer } from "react";
import { AxiosError } from "axios";
import { ActionType, createAsyncAction, getType } from "typesafe-actions";

import { getJobFunctions } from "@app/api/rest";
import { JobFunction, PageQuery } from "@app/api/models";

export const {
  request: fetchRequest,
  success: fetchSuccess,
  failure: fetchFailure,
} = createAsyncAction(
  "useFetchJobFunctions/fetch/request",
  "useFetchJobFunctions/fetch/success",
  "useFetchJobFunctions/fetch/failure"
)<void, Array<JobFunction>, AxiosError>();

type State = Readonly<{
  isFetching: boolean;
  jobFunctions?: Array<JobFunction>;
  fetchError?: AxiosError;
  fetchCount: number;
}>;

const defaultState: State = {
  isFetching: false,
  jobFunctions: undefined,
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
        jobFunctions: action.payload,
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
  jobFunctions?: Array<JobFunction>;
  isFetching: boolean;
  fetchError?: AxiosError;
  fetchCount: number;
  fetchJobFunctions: () => void;
  fetchAllJobFunctions: () => void;
}

export const useFetchJobFunctions = (
  defaultIsFetching: boolean = false
): IState => {
  const [state, dispatch] = useReducer(reducer, defaultIsFetching, initReducer);

  const fetchJobFunctions = useCallback(() => {
    dispatch(fetchRequest());

    getJobFunctions()
      .then(({ data }) => {
        dispatch(fetchSuccess(data));
      })
      .catch((error: AxiosError) => {
        dispatch(fetchFailure(error));
      });
  }, []);

  const fetchAllJobFunctions = useCallback(() => {
    dispatch(fetchRequest());

    getJobFunctions()
      .then(({ data }) => {
        dispatch(fetchSuccess(data));
      })
      .catch((error: AxiosError) => {
        dispatch(fetchFailure(error));
      });
  }, []);

  return {
    jobFunctions: state.jobFunctions,
    isFetching: state.isFetching,
    fetchError: state.fetchError,
    fetchCount: state.fetchCount,
    fetchJobFunctions,
    fetchAllJobFunctions,
  };
};

export default useFetchJobFunctions;
