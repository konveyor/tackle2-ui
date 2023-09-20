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
import { useFetchArchetypeById } from "./archetypes";

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

export function useGetReviewByItemId(
  id?: string | number,
  isArchetype?: boolean
) {
  const {
    application,
    isFetching: isApplicationFetching,
    fetchError: applicationError,
  } = useFetchApplicationById(id);

  const {
    archetype,
    isFetching: isArchetypeFetching,
    fetchError: archetypeError,
  } = useFetchArchetypeById(id);

  let review = null;
  let isLoading = false;
  let isError = false;

  const reviewId = application?.review?.id || archetype?.review?.id;

  const reviewQuery = useQuery(
    [
      reviewsByItemIdQueryKey,
      reviewId,
      application?.review?.id,
      archetype?.review?.id,
    ],
    () => (reviewId ? getReviewById(reviewId) : null),
    {
      enabled: !!reviewId,
    }
  );

  if (reviewId) {
    review = reviewQuery.data;
    isLoading = reviewQuery.isLoading;
    isError = reviewQuery.isError;
  }

  return {
    application,
    archetype,
    review,
    isLoading,
    isError,
    isFetching: isApplicationFetching || isLoading || isArchetypeFetching,
    fetchError:
      applicationError || (review ? reviewQuery.error : null) || archetypeError,
  };
}
