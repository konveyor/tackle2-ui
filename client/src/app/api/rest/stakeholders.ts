import axios from "axios";

import { New, Stakeholder } from "../models";
import { hub } from "../rest";

const STAKEHOLDERS = hub`/stakeholders`;

export const getStakeholders = (): Promise<Stakeholder[]> =>
  axios.get(STAKEHOLDERS).then((response) => response.data);

export const deleteStakeholder = (id: number): Promise<Stakeholder> =>
  axios.delete(`${STAKEHOLDERS}/${id}`);

export const createStakeholder = (
  obj: New<Stakeholder>
): Promise<Stakeholder> => axios.post(STAKEHOLDERS, obj);

export const updateStakeholder = (obj: Stakeholder): Promise<Stakeholder> =>
  axios.put(`${STAKEHOLDERS}/${obj.id}`, obj);
