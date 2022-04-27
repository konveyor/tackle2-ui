import React from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";

import { getReviews } from "@app/api/rest";
import { AxiosError } from "axios";
import { Review } from "@app/api/models";

export interface IReviewFetchState {
  reviews: Review[];
  isFetching: boolean;
  fetchError: any;
  refetch: any;
}

export const reviewsQueryKey = "reviews";

export const useFetchReviews = (): IReviewFetchState => {
  const [reviews, setReviews] = React.useState<Review[]>([]);
  const { isLoading, error, refetch } = useQuery(reviewsQueryKey, () =>
    getReviews()
      .then(({ data }) => {
        setReviews(data);
        return data;
      })
      .catch((error) => {
        console.log("error, ", error);
        return error;
      })
  );
  return {
    reviews,
    isFetching: isLoading,
    fetchError: error,
    refetch,
  };
};
