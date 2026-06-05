import axios from "axios";

import { New, StakeholderGroup } from "../models";
import { hub } from "../rest";

const STAKEHOLDER_GROUPS = hub`/stakeholdergroups`;

export const getStakeholderGroups = () =>
  axios
    .get<StakeholderGroup[]>(STAKEHOLDER_GROUPS)
    .then((response) => response.data);

export const createStakeholderGroup = (obj: New<StakeholderGroup>) =>
  axios
    .post<StakeholderGroup>(STAKEHOLDER_GROUPS, obj)
    .then((response) => response.data);

export const updateStakeholderGroup = (obj: StakeholderGroup) =>
  axios.put<void>(`${STAKEHOLDER_GROUPS}/${obj.id}`, obj);

export const deleteStakeholderGroup = (id: number) =>
  axios.delete<void>(`${STAKEHOLDER_GROUPS}/${id}`);
