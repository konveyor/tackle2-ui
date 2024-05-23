import { useMemo } from "react";
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
import { universalComparator } from "@app/utils/utils";

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
  const { data, isLoading, isSuccess, error, refetch } = useQuery({
    queryKey: [TagCategoriesQueryKey, TagsQueryKey],
    queryFn: getTagCategories,
    onError: (error: AxiosError) => console.log("error, ", error),
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

export const useFetchTagsWithTagItems = () => {
  // fetching tag categories with their tags is to most compact way to get all of
  // that information in a single call
  const { tagCategories, isFetching, isSuccess, fetchError, refetch } =
    useFetchTagCategories();

  // transform the tag categories in a list of tags with category refs
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

  // for each tag, build a `TagItemType` for easy use in the UI
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
  onSuccess: (res: any) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTag,
    onSuccess: (res) => {
      onSuccess(res);
      queryClient.invalidateQueries([TagCategoriesQueryKey, TagsQueryKey]);
    },
    onError: (err: AxiosError) => {
      onError(err);
      queryClient.invalidateQueries([TagCategoriesQueryKey, TagsQueryKey]);
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
      queryClient.invalidateQueries([TagCategoriesQueryKey, TagsQueryKey]);
    },
    onError: (err: AxiosError) => {
      onError(err);
      queryClient.invalidateQueries([TagCategoriesQueryKey, TagsQueryKey]);
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
      queryClient.invalidateQueries([TagCategoriesQueryKey, TagsQueryKey]);
    },
    onError: (err: AxiosError) => {
      onError(err);
      queryClient.invalidateQueries([TagCategoriesQueryKey, TagsQueryKey]);
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
