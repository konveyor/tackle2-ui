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
  const { data, isLoading, error, refetch } = useQuery(
    TagsQueryKey,
    async () => (await getTags()).data,
    {
      onError: (error) => console.log("error, ", error),
    }
  );
  return {
    tags: data || [],
    isFetching: isLoading,
    fetchError: error,
    refetch,
  };
};

export const useFetchTagTypes = (): ITagTypeFetchState => {
  const { data, isLoading, error, refetch } = useQuery(
    TagTypesQueryKey,
    async () => (await getTagTypes()).data,
    {
      onError: (error) => console.log("error, ", error),
    }
  );
  return {
    tagTypes: data || [],
    isFetching: isLoading,
    fetchError: error,
    refetch,
  };
};
