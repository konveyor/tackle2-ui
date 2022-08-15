import { useMutation, useQuery, useQueryClient } from "react-query";

import { deleteTag, deleteTagType, getTags, getTagTypes } from "@app/api/rest";
import { Tag, TagType } from "@app/api/models";
import { AxiosError } from "axios";

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

export const useDeleteTagMutation = (
  onSuccess: (res: any) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  const { isLoading, mutate, error } = useMutation(deleteTag, {
    onSuccess: (res) => {
      onSuccess(res);
      queryClient.invalidateQueries(TagsQueryKey);
    },
    onError: (err: AxiosError) => {
      onError(err);
      queryClient.invalidateQueries(TagsQueryKey);
    },
  });
  return {
    mutate,
    isLoading,
    error,
  };
};
export const useDeleteTagTypeMutation = (
  onSuccess: (res: any) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  const { isLoading, mutate, error } = useMutation(deleteTagType, {
    onSuccess: (res) => {
      onSuccess(res);
      queryClient.invalidateQueries(TagTypesQueryKey);
    },
    onError: (err: AxiosError) => {
      onError(err);
      queryClient.invalidateQueries(TagTypesQueryKey);
    },
  });
  return {
    mutate,
    isLoading,
    error,
  };
};
