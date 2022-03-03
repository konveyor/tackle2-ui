import { useCallback, useReducer } from "react";
import { AxiosError } from "axios";
import { ActionType, createAsyncAction, getType } from "typesafe-actions";

import { getBusinessServices } from "@app/api/rest";
import {
  PageRepresentation,
  BusinessService,
  PageQuery,
} from "@app/api/models";

export const {
  request: fetchRequest,
  success: fetchSuccess,
  failure: fetchFailure,
} = createAsyncAction(
  "useFetchBusinessServices/fetch/request",
  "useFetchBusinessServices/fetch/success",
  "useFetchBusinessServices/fetch/failure"
)<void, Array<BusinessService>, AxiosError>();

type State = Readonly<{
  isFetching: boolean;
  businessServices?: Array<BusinessService>;
  fetchError?: AxiosError;
  fetchCount: number;
}>;

const defaultState: State = {
  isFetching: false,
  businessServices: undefined,
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
        businessServices: action.payload,
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
  businessServices?: Array<BusinessService>;
  isFetching: boolean;
  fetchError?: AxiosError;
  fetchCount: number;
  fetchBusinessServices: () => void;
}

export const useFetchBusinessServices = (
  defaultIsFetching: boolean = false
): IState => {
  const [state, dispatch] = useReducer(reducer, defaultIsFetching, initReducer);

  const fetchBusinessServices = useCallback(() => {
    dispatch(fetchRequest());

    getBusinessServices()
      .then(({ data }) => {
        dispatch(fetchSuccess(data));
      })
      .catch((error: AxiosError) => {
        dispatch(fetchFailure(error));
      });
  }, []);

  return {
    businessServices: state.businessServices,
    isFetching: state.isFetching,
    fetchError: state.fetchError,
    fetchCount: state.fetchCount,
    fetchBusinessServices,
  };
};

export default useFetchBusinessServices;
