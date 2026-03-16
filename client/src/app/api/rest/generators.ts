import axios from "axios";

import { Generator, New } from "../models";
import { hub } from "../rest";

const ASSET_GENERATORS = hub`/generators`;

export const getGenerators = () =>
  axios.get<Generator[]>(ASSET_GENERATORS).then(({ data }) => data);

export const getGeneratorById = (id: number | string) =>
  axios.get<Generator>(`${ASSET_GENERATORS}/${id}`).then(({ data }) => data);

// success with code 201 and created entity as response data
export const createGenerator = (generator: New<Generator>) => {
  return axios
    .post<Generator>(ASSET_GENERATORS, generator)
    .then((res) => res.data);
};

// success with code 204 and therefore no response content
export const updateGenerator = (generator: Generator) => {
  return axios.put<void>(`${ASSET_GENERATORS}/${generator.id}`, generator);
};

// success with code 204 and therefore no response content
export const deleteGenerator = (id: number) =>
  axios.delete<void>(`${ASSET_GENERATORS}/${id}`);
