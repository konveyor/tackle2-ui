import axios, { AxiosResponse } from "axios";

import { New, Target } from "../models";
import { hub } from "../rest";

const TARGETS = hub`/targets`;

export const updateTarget = (obj: Target) =>
  axios.put<Target>(`${TARGETS}/${obj.id}`, obj);

export const createTarget = (
  obj: New<Target>
): Promise<AxiosResponse<Target>> => axios.post<Target>(TARGETS, obj);

export const deleteTarget = (id: number): Promise<Target> =>
  axios.delete(`${TARGETS}/${id}`);

export const getTargets = (): Promise<Target[]> =>
  axios.get(TARGETS).then((response) => response.data);
