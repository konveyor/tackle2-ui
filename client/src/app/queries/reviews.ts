import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { DEFAULT_REFETCH_INTERVAL } from "@app/Constants";
import { New, Review } from "@app/api/models";
import {
  createReview,
  deleteReview,
  getReviewById,
  getReviews,
  updateReview,
} from "@app/api/rest";

import { ApplicationsQueryKey } from "./applications";
import { ARCHETYPES_QUERY_KEY } from "./archetypes";

const reviewQueryKey = "review";
const reviewsQueryKey = "reviews";

export const useFetchReviews = (
  refetchInterval: number | false = DEFAULT_REFETCH_INTERVAL
) => {
  const { data, isLoading, error } = useQuery({
    queryKey: [reviewsQueryKey],
    queryFn: getReviews,
    onError: (error: AxiosError) => console.log("error, ", error),
    refetchInterval,
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
      queryClient.invalidateQueries({ queryKey: [reviewsQueryKey] });
      queryClient.invalidateQueries({ queryKey: [ApplicationsQueryKey] });
      queryClient.invalidateQueries({ queryKey: [ARCHETYPES_QUERY_KEY] });
      onSuccess?.(res?.application?.name || "");
    },
    onError: (error) => {
      onError?.(error as AxiosError);
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
      queryClient.invalidateQueries({ queryKey: [reviewsQueryKey] });
      queryClient.invalidateQueries({ queryKey: [reviewQueryKey, args.id] });
      queryClient.invalidateQueries({ queryKey: [ApplicationsQueryKey] });
      queryClient.invalidateQueries({ queryKey: [ARCHETYPES_QUERY_KEY] });
      onSuccess?.(args?.application?.name || "");
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
      onSuccess?.(args.name);
      queryClient.invalidateQueries({ queryKey: [reviewsQueryKey] });
      queryClient.invalidateQueries({ queryKey: [reviewQueryKey, args.id] });
      queryClient.invalidateQueries({ queryKey: [ApplicationsQueryKey] });
      queryClient.invalidateQueries({ queryKey: [ARCHETYPES_QUERY_KEY] });
    },
    onError,
  });
};

export const useFetchReviewById = (
  id?: number | string,
  refetchInterval: number | false = DEFAULT_REFETCH_INTERVAL
) => {
  const { data, error, isFetching } = useQuery({
    queryKey: [reviewQueryKey, id],
    queryFn: () =>
      id === undefined ? Promise.resolve(null) : getReviewById(id),
    onError: (error: AxiosError) => console.log("error, ", error),
    enabled: id !== undefined,
    refetchInterval,
  });

  return {
    review: data,
    isFetching: isFetching,
    fetchError: error,
  };
};
