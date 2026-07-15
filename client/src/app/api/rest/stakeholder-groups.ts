import axios from "axios";

import { New, StakeholderGroup } from "../models";
import { hub } from "../rest";

const STAKEHOLDER_GROUPS = hub`/stakeholdergroups`;

export const getStakeholderGroups = (): Promise<StakeholderGroup[]> =>
  axios.get(STAKEHOLDER_GROUPS).then((response) => response.data);

export const deleteStakeholderGroup = (id: number): Promise<StakeholderGroup> =>
  axios.delete(`${STAKEHOLDER_GROUPS}/${id}`);

export const createStakeholderGroup = (
  obj: New<StakeholderGroup>
): Promise<StakeholderGroup> =>
  axios.post(STAKEHOLDER_GROUPS, obj).then((res) => res.data);

export const updateStakeholderGroup = (
  obj: StakeholderGroup
): Promise<StakeholderGroup> =>
  axios.put(`${STAKEHOLDER_GROUPS}/${obj.id}`, obj);
