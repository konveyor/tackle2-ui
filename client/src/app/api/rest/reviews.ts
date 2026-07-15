import axios from "axios";

import { New, Review } from "../models";
import { hub } from "../rest";

const REVIEWS = hub`/reviews`;

export const getReviews = (): Promise<Review[]> => {
  return axios.get(`${REVIEWS}`).then((response) => response.data);
};

export const getReviewById = (id: number | string): Promise<Review> => {
  return axios.get(`${REVIEWS}/${id}`).then((response) => response.data);
};

export const createReview = (obj: New<Review>): Promise<Review> => {
  return axios.post(`${REVIEWS}`, obj);
};

export const updateReview = (obj: Review): Promise<Review> => {
  return axios.put(`${REVIEWS}/${obj.id}`, obj);
};

export const deleteReview = (id: number): Promise<Review> => {
  return axios.delete(`${REVIEWS}/${id}`);
};
