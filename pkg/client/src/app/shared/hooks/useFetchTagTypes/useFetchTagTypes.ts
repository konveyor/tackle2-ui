import { useCallback, useReducer } from "react";
import { AxiosError } from "axios";
import { ActionType, createAsyncAction, getType } from "typesafe-actions";

import { getTagTypes, TagTypeSortBy, TagTypeSortByQuery } from "@app/api/rest";
import { PageRepresentation, PageQuery, TagType } from "@app/api/models";

export const {
  request: fetchRequest,
  success: fetchSuccess,
  failure: fetchFailure,
} = createAsyncAction(
  "useFetchTagTypes/fetch/request",
  "useFetchTagTypes/fetch/success",
  "useFetchTagTypes/fetch/failure"
)<void, PageRepresentation<TagType>, AxiosError>();

type State = Readonly<{
  isFetching: boolean;
  tagTypes?: PageRepresentation<TagType>;
  fetchError?: AxiosError;
  fetchCount: number;
}>;

const defaultState: State = {
  isFetching: false,
  tagTypes: undefined,
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
        tagTypes: action.payload,
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
  tagTypes?: PageRepresentation<TagType>;
  isFetching: boolean;
  fetchError?: AxiosError;
  fetchCount: number;
  fetchTagTypes: (
    filters: {
      tagTypes?: string[];
      tags?: string[];
    },
    page: PageQuery,
    sortBy?: TagTypeSortByQuery
  ) => void;
  fetchAllTagTypes: (sortBy?: TagTypeSortByQuery) => void;
}

export const useFetchTagTypes = (
  defaultIsFetching: boolean = false
): IState => {
  const [state, dispatch] = useReducer(reducer, defaultIsFetching, initReducer);

  const fetchTagTypes = useCallback(
    (
      filters: {
        name?: string[];
        tagTypes?: string[];
      },
      page: PageQuery,
      sortBy?: TagTypeSortByQuery
    ) => {
      dispatch(fetchRequest());

      getTagTypes(filters, page, sortBy)
        .then(({ data }) => {
          const list = data._embedded["tag-type"];
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

  const fetchAllTagTypes = useCallback((sortBy?: TagTypeSortByQuery) => {
    dispatch(fetchRequest());

    getTagTypes(
      {},
      { page: 1, perPage: 1000 },
      sortBy || { field: TagTypeSortBy.NAME }
    )
      .then(({ data }) => {
        const list = data._embedded["tag-type"];
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
    tagTypes: state.tagTypes,
    isFetching: state.isFetching,
    fetchError: state.fetchError,
    fetchCount: state.fetchCount,
    fetchTagTypes,
    fetchAllTagTypes,
  };
};

export default useFetchTagTypes;
