import axios from "axios";

import { New, Review } from "../models";
import { hub } from "../rest";

const REVIEWS = hub`/reviews`;

export const getReviews = () =>
  axios.get<Review[]>(REVIEWS).then((response) => response.data);

export const getReviewById = (id: number | string) =>
  axios.get<Review>(`${REVIEWS}/${id}`).then((response) => response.data);

export const createReview = (obj: New<Review>) =>
  axios.post<Review>(REVIEWS, obj).then((response) => response.data);

export const updateReview = (obj: Review) =>
  axios.put<void>(`${REVIEWS}/${obj.id}`, obj);

export const deleteReview = (id: number) =>
  axios.delete<void>(`${REVIEWS}/${id}`);
