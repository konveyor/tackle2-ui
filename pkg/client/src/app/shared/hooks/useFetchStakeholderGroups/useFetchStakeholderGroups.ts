import { useCallback, useReducer } from "react";
import { AxiosError } from "axios";
import { ActionType, createAsyncAction, getType } from "typesafe-actions";

import {
  getStakeholderGroups,
  StakeholderGroupSortBy,
  StakeholderGroupSortByQuery,
} from "@app/api/rest";
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
)<void, PageRepresentation<StakeholderGroup>, AxiosError>();

type State = Readonly<{
  isFetching: boolean;
  stakeholderGroups?: PageRepresentation<StakeholderGroup>;
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
  stakeholderGroups?: PageRepresentation<StakeholderGroup>;
  isFetching: boolean;
  fetchError?: AxiosError;
  fetchCount: number;
  fetchStakeholderGroups: (
    filters: {
      name?: string[];
      description?: string[];
      stakeholder?: string[];
    },
    page: PageQuery,
    sortBy?: StakeholderGroupSortByQuery
  ) => void;
  fetchAllStakeholderGroups: () => void;
}

export const useFetchStakeholderGroups = (
  defaultIsFetching: boolean = false
): IState => {
  const [state, dispatch] = useReducer(reducer, defaultIsFetching, initReducer);

  const fetchStakeholderGroups = useCallback(
    (
      filters: {
        name?: string[];
        description?: string[];
        stakeholder?: string[];
      },
      page: PageQuery,
      sortBy?: StakeholderGroupSortByQuery
    ) => {
      dispatch(fetchRequest());

      getStakeholderGroups(filters, page, sortBy)
        .then(({ data }) => {
          const list = data._embedded["stakeholder-group"];
          const total = data.total_count;

          dispatch(
            fetchSuccess({
              data: list,
              meta: {
                count: total,
              },
            })
          );
        })
        .catch((error: AxiosError) => {
          dispatch(fetchFailure(error));
        });
    },
    []
  );

  const fetchAllStakeholderGroups = useCallback(() => {
    dispatch(fetchRequest());

    getStakeholderGroups(
      {},
      { page: 1, perPage: 1000 },
      { field: StakeholderGroupSortBy.NAME }
    )
      .then(({ data }) => {
        const list = data._embedded["stakeholder-group"];
        const total = data.total_count;

        dispatch(
          fetchSuccess({
            data: list,
            meta: {
              count: total,
            },
          })
        );
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
    fetchAllStakeholderGroups,
  };
};

export default useFetchStakeholderGroups;
