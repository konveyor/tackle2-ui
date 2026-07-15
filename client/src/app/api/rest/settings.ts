import axios from "axios";

import { Setting, SettingTypes } from "../models";
import { hub } from "../rest";

const SETTINGS = hub`/settings`;

export const getSettingById = <K extends keyof SettingTypes>(id: K) =>
  axios
    .get<SettingTypes[K]>(`${SETTINGS}/${id}`)
    .then((response) => response.data);

export const updateSetting = <K extends keyof SettingTypes>(obj: Setting<K>) =>
  axios.put<void>(
    `${SETTINGS}/${obj.key}`,
    typeof obj.value == "boolean" ? obj.value.toString() : obj.value
  );
