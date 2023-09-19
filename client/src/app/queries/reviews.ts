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
import { useFetchApplicationById } from "./applications";

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
  onSuccess: (name: string) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (args: IReviewMutation) => deleteReview(args.id),
    onSuccess: (_, args) => {
      onSuccess(args.name);
      queryClient.invalidateQueries([reviewsQueryKey]);
    },
    onError: onError,
  });
};

export function useGetReviewByAppId(applicationId: string | number) {
  const {
    application,
    isFetching: isApplicationFetching,
    fetchError: applicationError,
  } = useFetchApplicationById(applicationId);

  let review = null;
  let isLoading = false;
  let isError = false;

  const appReviewId = application?.review?.id;

  const reviewQuery = useQuery(
    ["review", application?.review?.id],
    () => (appReviewId ? getReviewById(appReviewId) : null),
    {
      enabled: !!appReviewId,
    }
  );

  if (appReviewId) {
    review = reviewQuery.data;
    isLoading = reviewQuery.isLoading;
    isError = reviewQuery.isError;
  }

  return {
    application,
    review,
    isLoading,
    isError,
    isFetching: isApplicationFetching || isLoading,
    fetchError: applicationError || (review ? reviewQuery.error : null),
  };
}
