import { useQuery } from "react-query";

import { getTags, getTagTypes } from "@app/api/rest";
import { Tag, TagType } from "@app/api/models";

export interface ITagFetchState {
  tags: Tag[];
  isFetching: boolean;
  fetchError: any;
  refetch: any;
}

export interface ITagTypeFetchState {
  tagTypes: TagType[];
  isFetching: boolean;
  fetchError: any;
  refetch: any;
}

export const TagsQueryKey = "tags";
export const TagTypesQueryKey = "tagtypes";

export const useFetchTags = (): ITagFetchState => {
  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useQuery(TagsQueryKey, getTags, {
    onError: (error) => console.log("error, ", error),
  });
  return {
    tags: response?.data || [],
    isFetching: isLoading,
    fetchError: error,
    refetch,
  };
};

export const useFetchTagTypes = (): ITagTypeFetchState => {
  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useQuery(TagTypesQueryKey, getTagTypes, {
    onError: (error) => console.log("error, ", error),
  });
  return {
    tagTypes: response?.data || [],
    isFetching: isLoading,
    fetchError: error,
    refetch,
  };
};
