import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { deleteReview, getReviews } from "@app/api/rest";
import { Review } from "@app/api/models";

export interface IReviewFetchState {
  reviews: Review[];
  isFetching: boolean;
  fetchError: any;
  refetch: any;
}

export const reviewsQueryKey = "reviews";

export const useFetchReviews = (): IReviewFetchState => {
  const { data, isLoading, error, refetch } = useQuery(
    [reviewsQueryKey],
    async () => (await getReviews()).data,
    {
      onError: (error) => console.log("error, ", error),
    }
  );
  return {
    reviews: data || [],
    isFetching: isLoading,
    fetchError: error,
    refetch,
  };
};

export const useDeleteReviewMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteReview,
  });
};
