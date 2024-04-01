import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createReview,
  deleteReview,
  getReviewById,
  getReviews,
  updateReview,
} from "@app/api/rest";
import { New, Review } from "@app/api/models";
import { AxiosError } from "axios";
import { ApplicationsQueryKey } from "./applications";

export const reviewQueryKey = "review";
export const reviewsByItemIdQueryKey = "reviewsByItemId";
export const reviewsQueryKey = "reviews";

export const useFetchReviews = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: [reviewsQueryKey],
    queryFn: () => getReviews(),
    onError: (error) => console.log("error, ", error),
  });
  return {
    reviews: data || [],
    isFetching: isLoading,
    fetchError: error,
  };
};

export const useCreateReviewMutation = (
  onSuccess?: (name: string) => void,
  onError?: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (review: New<Review>) => createReview(review),
    onSuccess: (res) => {
      queryClient.invalidateQueries([
        reviewsByItemIdQueryKey,
        res?.application?.id,
        res?.archetype?.id,
      ]);
      onSuccess && onSuccess(res?.application?.name || "");
    },
    onError: (error) => {
      onError && onError(error as AxiosError);
    },
  });
};

export const useUpdateReviewMutation = (
  onSuccess?: (name: string) => void,
  onError?: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (review: Review) => updateReview(review),
    onSuccess: (_, args) => {
      queryClient.invalidateQueries([
        reviewsByItemIdQueryKey,
        _?.application?.id,
        _.archetype?.id,
      ]);
      onSuccess && onSuccess(args?.application?.name || "");
    },
    onError: onError,
  });
};

export interface IReviewMutation {
  id: number;
  name: string;
}

export const useDeleteReviewMutation = (
  onSuccess?: (name: string) => void,
  onError?: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (args: IReviewMutation) => deleteReview(args.id),
    onSuccess: (_, args) => {
      onSuccess && onSuccess(args.name);
      queryClient.invalidateQueries([reviewsQueryKey]);
      queryClient.invalidateQueries([ApplicationsQueryKey]);
    },
    onError: onError && onError,
  });
};

export const useFetchReviewById = (id?: number | string) => {
  const { data, error, isFetching } = useQuery({
    queryKey: [reviewQueryKey, id],
    queryFn: () =>
      id === undefined ? Promise.resolve(null) : getReviewById(id),
    onError: (error: AxiosError) => console.log("error, ", error),
    enabled: id !== undefined,
  });

  return {
    review: data,
    isFetching: isFetching,
    fetchError: error,
  };
};
