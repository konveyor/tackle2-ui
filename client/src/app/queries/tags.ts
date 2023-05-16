import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  deleteTag,
  deleteTagCategory,
  getTags,
  getTagCategories,
  createTag,
  updateTag,
  createTagCategory,
  updateTagCategory,
} from "@app/api/rest";
import { AxiosError } from "axios";

export const TagsQueryKey = "tags";
export const TagCategoriesQueryKey = "tagcategories";

export const useFetchTags = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [TagsQueryKey],
    queryFn: getTags,
    onError: (error: AxiosError) => console.log("error, ", error),
  });
  return {
    tags: data || [],
    isFetching: isLoading,
    fetchError: error,
    refetch,
  };
};

export const useFetchTagCategories = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [TagCategoriesQueryKey],
    queryFn: getTagCategories,
    onError: (error: AxiosError) => console.log("error, ", error),
  });
  return {
    tagCategories: data || [],
    isFetching: isLoading,
    fetchError: error,
    refetch,
  };
};

export const useCreateTagMutation = (
  onSuccess: (res: any) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTag,
    onSuccess: (res) => {
      onSuccess(res);
      queryClient.invalidateQueries([TagsQueryKey]);
    },
    onError: (err: AxiosError) => {
      onError(err);
      queryClient.invalidateQueries([TagsQueryKey]);
    },
  });
};

export const useCreateTagCategoryMutation = (
  onSuccess: (res: any) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTagCategory,
    onSuccess: (res) => {
      onSuccess(res);
      queryClient.invalidateQueries([TagCategoriesQueryKey]);
    },
    onError: (err: AxiosError) => {
      onError(err);
      queryClient.invalidateQueries([TagCategoriesQueryKey]);
    },
  });
};

export const useUpdateTagMutation = (
  onSuccess: (res: any) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateTag,
    onSuccess: (res) => {
      onSuccess(res);
      queryClient.invalidateQueries([TagsQueryKey]);
    },
    onError: (err: AxiosError) => {
      onError(err);
      queryClient.invalidateQueries([TagsQueryKey]);
    },
  });
};

export const useUpdateTagCategoryMutation = (
  onSuccess: (res: any) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateTagCategory,
    onSuccess: (res) => {
      onSuccess(res);
      queryClient.invalidateQueries([TagCategoriesQueryKey]);
    },
    onError: (err: AxiosError) => {
      onError(err);
      queryClient.invalidateQueries([TagCategoriesQueryKey]);
    },
  });
};
export const useDeleteTagMutation = (
  onSuccess: (res: any) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTag,
    onSuccess: (res) => {
      onSuccess(res);
      queryClient.invalidateQueries([TagsQueryKey]);
    },
    onError: (err: AxiosError) => {
      onError(err);
      queryClient.invalidateQueries([TagsQueryKey]);
    },
  });
};

export const useDeleteTagCategoryMutation = (
  onSuccess: (res: any) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTagCategory,
    onSuccess: (res) => {
      onSuccess(res);
      queryClient.invalidateQueries([TagCategoriesQueryKey]);
    },
    onError: (err: AxiosError) => {
      onError(err);
      queryClient.invalidateQueries([TagCategoriesQueryKey]);
    },
  });
};
