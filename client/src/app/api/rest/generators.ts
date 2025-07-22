import axios from "axios";
import { Generator, New } from "../models";
import { ASSET_GENERATORS } from "../rest";

export const getGenerators = () =>
  axios.get<Generator[]>(ASSET_GENERATORS).then(({ data }) => data);

export const getGeneratorById = (id: number | string) =>
  axios.get<Generator>(`${ASSET_GENERATORS}/${id}`).then(({ data }) => data);

// success with code 201 and created entity as response data
export const createGenerator = (generator: New<Generator>) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { description, ...generatorWithoutDescription } = generator; //TODO: Remove this when the backend is updated with description support
  return axios
    .post<Generator>(ASSET_GENERATORS, generatorWithoutDescription)
    .then((res) => res.data);
};

// success with code 204 and therefore no response content
export const updateGenerator = (generator: Generator) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { description, ...generatorWithoutDescription } = generator; //TODO: Remove this when the backend is updated with description support
  return axios.put<void>(
    `${ASSET_GENERATORS}/${generator.id}`,
    generatorWithoutDescription
  );
};
// success with code 204 and therefore no response content
export const deleteGenerator = (id: number) =>
  axios.delete<void>(`${ASSET_GENERATORS}/${id}`);
