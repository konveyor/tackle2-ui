import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { deleteReview, getReviews } from "@app/api/rest";
import { Review } from "@app/api/models";
import { AxiosError, AxiosResponse } from "axios";

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
