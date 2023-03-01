import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  deleteTag,
  deleteTagCategory,
  getTags,
  getTagCategories,
} from "@app/api/rest";
import { Tag, TagCategory } from "@app/api/models";
import { AxiosError } from "axios";

export interface ITagFetchState {
  tags: Tag[];
  isFetching: boolean;
  fetchError: any;
  refetch: any;
}

export interface ITagCategoryFetchState {
  tagCategories: TagCategory[];
  isFetching: boolean;
  fetchError: any;
  refetch: any;
}

export const TagsQueryKey = "tags";
export const TagCategoriesQueryKey = "tagcategories";

export const useFetchTags = (): ITagFetchState => {
  const { data, isLoading, error, refetch } = useQuery(
    [TagsQueryKey],
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

export const useFetchTagCategories = (): ITagCategoryFetchState => {
  const { data, isLoading, error, refetch } = useQuery(
    [TagCategoriesQueryKey],
    async () => (await getTagCategories()).data,
    {
      onError: (error) => console.log("error, ", error),
    }
  );
  return {
    tagCategories: data || [],
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
      queryClient.invalidateQueries([TagsQueryKey]);
    },
    onError: (err: AxiosError) => {
      onError(err);
      queryClient.invalidateQueries([TagsQueryKey]);
    },
  });
  return {
    mutate,
    isLoading,
    error,
  };
};
export const useDeleteTagCategoryMutation = (
  onSuccess: (res: any) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  const { isLoading, mutate, error } = useMutation(deleteTagCategory, {
    onSuccess: (res) => {
      onSuccess(res);
      queryClient.invalidateQueries([TagCategoriesQueryKey]);
    },
    onError: (err: AxiosError) => {
      onError(err);
      queryClient.invalidateQueries([TagCategoriesQueryKey]);
    },
  });
  return {
    mutate,
    isLoading,
    error,
  };
};
