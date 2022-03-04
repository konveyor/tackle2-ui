import { useCallback, useReducer } from "react";
import { AxiosError } from "axios";
import { ActionType, createAsyncAction, getType } from "typesafe-actions";

import { getStakeholderGroups } from "@app/api/rest";
import {
  PageRepresentation,
  StakeholderGroup,
  PageQuery,
} from "@app/api/models";

export const {
  request: fetchRequest,
  success: fetchSuccess,
  failure: fetchFailure,
} = createAsyncAction(
  "useFetchStakeholderGroups/fetch/request",
  "useFetchStakeholderGroups/fetch/success",
  "useFetchStakeholderGroups/fetch/failure"
)<void, Array<StakeholderGroup>, AxiosError>();

type State = Readonly<{
  isFetching: boolean;
  stakeholderGroups?: Array<StakeholderGroup>;
  fetchError?: AxiosError;
  fetchCount: number;
}>;

const defaultState: State = {
  isFetching: false,
  stakeholderGroups: undefined,
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
        stakeholderGroups: action.payload,
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
  stakeholderGroups?: Array<StakeholderGroup>;
  isFetching: boolean;
  fetchError?: AxiosError;
  fetchCount: number;
  fetchStakeholderGroups: () => void;
}

export const useFetchStakeholderGroups = (
  defaultIsFetching: boolean = false
): IState => {
  const [state, dispatch] = useReducer(reducer, defaultIsFetching, initReducer);

  const fetchStakeholderGroups = useCallback(() => {
    dispatch(fetchRequest());

    getStakeholderGroups()
      .then(({ data }) => {
        dispatch(fetchSuccess(data));
      })
      .catch((error: AxiosError) => {
        dispatch(fetchFailure(error));
      });
  }, []);

  return {
    stakeholderGroups: state.stakeholderGroups,
    isFetching: state.isFetching,
    fetchError: state.fetchError,
    fetchCount: state.fetchCount,
    fetchStakeholderGroups,
  };
};

export default useFetchStakeholderGroups;
