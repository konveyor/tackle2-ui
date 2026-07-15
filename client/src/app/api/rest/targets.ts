import axios from "axios";

import { New, Target } from "../models";
import { hub } from "../rest";

const TARGETS = hub`/targets`;

export const getTargets = () =>
  axios.get<Target[]>(TARGETS).then((response) => response.data);

export const createTarget = (obj: New<Target>) =>
  axios.post<Target>(TARGETS, obj).then((response) => response.data);

export const updateTarget = (obj: Target) =>
  axios.put<void>(`${TARGETS}/${obj.id}`, obj);

export const deleteTarget = (id: number) =>
  axios.delete<void>(`${TARGETS}/${id}`);
