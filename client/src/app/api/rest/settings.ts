import axios from "axios";

import { Setting, SettingTypes } from "../models";
import { hub } from "../rest";

const SETTINGS = hub`/settings`;

export const getSettingById = <K extends keyof SettingTypes>(
  id: K
): Promise<SettingTypes[K]> =>
  axios.get(`${SETTINGS}/${id}`).then((response) => response.data);

export const updateSetting = <K extends keyof SettingTypes>(
  obj: Setting<K>
): Promise<Setting<K>> => axios.put(`${SETTINGS}/${obj.key}`, obj.value);
