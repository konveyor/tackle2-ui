import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { New, Tag, TagCategory } from "@app/api/models";
import {
  createTag,
  createTagCategory,
  deleteTag,
  deleteTagCategory,
  getTagCategories,
  getTags,
  updateTag,
  updateTagCategory,
} from "@app/api/rest";
import { universalComparator } from "@app/utils/utils";

const TagsQueryKey = "tags";
const TagCategoriesQueryKey = "tagcategories";

export const useFetchTags = (refetchInterval: number | false = false) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [TagsQueryKey],
    queryFn: getTags,
    onError: (error: AxiosError) => console.log("error, ", error),
    refetchInterval,
  });
  return {
    tags: data || [],
    isFetching: isLoading,
    fetchError: error,
    refetch,
  };
};

export const useFetchTagCategories = (refetchInterval?: number | false) => {
  const { data, isLoading, isSuccess, error, refetch } = useQuery({
    queryKey: [TagCategoriesQueryKey],
    queryFn: getTagCategories,
    onError: (error: AxiosError) => console.log("error, ", error),
    refetchInterval,
  });

  return {
    tagCategories: data || [],
    isFetching: isLoading,
    isSuccess,
    fetchError: error,
    refetch,
  };
};

/**
 * Tag repackaged as an ItemType to make it easier to use and display.
 */
export interface TagItemType {
  id: number;
  name: string;
  categoryName: string;
  tagName: string;
  tooltip?: string;
}

export const useFetchTagsWithTagItems = (
  refetchInterval: number | false = false
) => {
  const { tagCategories, isFetching, isSuccess, fetchError, refetch } =
    useFetchTagCategories(refetchInterval);

  const tags = useMemo(
    () =>
      tagCategories
        .flatMap(({ id, name, tags }) => {
          const ref = { id, name };
          return tags?.map((t) => {
            t.category = ref;
            return t;
          });
        })
        .filter(Boolean),
    [tagCategories]
  );

  const tagItems: TagItemType[] = useMemo(() => {
    return tags
      .map<TagItemType>((tag) => ({
        id: tag.id,
        categoryName: tag.category?.name ?? "",
        tagName: tag.name,
        name: `${tag.category?.name} / ${tag.name}`,
        tooltip: tag.category?.name,
      }))
      .sort((a, b) => universalComparator(a.name, b.name));
  }, [tags]);

  return {
    tagCategories,
    tags,
    tagItems,
    isFetching,
    isSuccess,
    fetchError,
    refetch,
  };
};

export const useCreateTagMutation = (
  onSuccess: () => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (obj: New<Tag>) => createTag(obj),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TagCategoriesQueryKey] });
      queryClient.invalidateQueries({ queryKey: [TagsQueryKey] });
      onSuccess();
    },
    onError: (err: AxiosError) => {
      queryClient.invalidateQueries({ queryKey: [TagCategoriesQueryKey] });
      queryClient.invalidateQueries({ queryKey: [TagsQueryKey] });
      onError(err);
    },
  });
};

export const useCreateTagCategoryMutation = (
  onSuccess: () => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (obj: New<TagCategory>) => createTagCategory(obj),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TagCategoriesQueryKey] });
      onSuccess();
    },
    onError: (err: AxiosError) => {
      queryClient.invalidateQueries({ queryKey: [TagCategoriesQueryKey] });
      onError(err);
    },
  });
};

export const useUpdateTagMutation = (
  onSuccess: () => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TagCategoriesQueryKey] });
      queryClient.invalidateQueries({ queryKey: [TagsQueryKey] });
      onSuccess();
    },
    onError: (err: AxiosError) => {
      queryClient.invalidateQueries({ queryKey: [TagCategoriesQueryKey] });
      queryClient.invalidateQueries({ queryKey: [TagsQueryKey] });
      onError(err);
    },
  });
};

export const useUpdateTagCategoryMutation = (
  onSuccess: () => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateTagCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TagCategoriesQueryKey] });
      queryClient.invalidateQueries({ queryKey: [TagsQueryKey] });
      onSuccess();
    },
    onError: (err: AxiosError) => {
      queryClient.invalidateQueries({ queryKey: [TagCategoriesQueryKey] });
      queryClient.invalidateQueries({ queryKey: [TagsQueryKey] });
      onError(err);
    },
  });
};

export const useDeleteTagMutation = (
  onSuccess: () => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TagCategoriesQueryKey] });
      queryClient.invalidateQueries({ queryKey: [TagsQueryKey] });
      onSuccess();
    },
    onError: (err: AxiosError) => {
      queryClient.invalidateQueries({ queryKey: [TagCategoriesQueryKey] });
      queryClient.invalidateQueries({ queryKey: [TagsQueryKey] });
      onError(err);
    },
  });
};

export const useDeleteTagCategoryMutation = (
  onSuccess: () => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTagCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TagCategoriesQueryKey] });
      queryClient.invalidateQueries({ queryKey: [TagsQueryKey] });
      onSuccess();
    },
    onError: (err: AxiosError) => {
      queryClient.invalidateQueries({ queryKey: [TagCategoriesQueryKey] });
      queryClient.invalidateQueries({ queryKey: [TagsQueryKey] });
      onError(err);
    },
  });
};
