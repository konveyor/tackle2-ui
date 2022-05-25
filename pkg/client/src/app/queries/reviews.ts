import { useQuery } from "react-query";

import { getReviews } from "@app/api/rest";
import { Review } from "@app/api/models";

export interface IReviewFetchState {
  reviews: Review[];
  isFetching: boolean;
  fetchError: any;
  refetch: any;
}

export const reviewsQueryKey = "reviews";

export const useFetchReviews = (): IReviewFetchState => {
  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useQuery(reviewsQueryKey, getReviews, {
    onError: (error) => console.log("error, ", error),
  });
  return {
    reviews: response?.data || [],
    isFetching: isLoading,
    fetchError: error,
    refetch,
  };
};
