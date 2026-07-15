import axios from "axios";

import { New, Stakeholder } from "../models";
import { hub } from "../rest";

const STAKEHOLDERS = hub`/stakeholders`;

export const getStakeholders = () =>
  axios.get<Stakeholder[]>(STAKEHOLDERS).then((response) => response.data);

export const createStakeholder = (obj: New<Stakeholder>) =>
  axios.post<Stakeholder>(STAKEHOLDERS, obj).then((response) => response.data);

export const updateStakeholder = (obj: Stakeholder) =>
  axios.put<void>(`${STAKEHOLDERS}/${obj.id}`, obj);

export const deleteStakeholder = (id: number) =>
  axios.delete<void>(`${STAKEHOLDERS}/${id}`);
