import axios from "axios";

import { New, SourcePlatform } from "../models";
import { hub } from "../rest";

const PLATFORMS = hub`/platforms`;

export const getPlatforms = () =>
  axios.get<SourcePlatform[]>(PLATFORMS).then(({ data }) => data);

export const getPlatformById = (id: number | string) =>
  axios.get<SourcePlatform>(`${PLATFORMS}/${id}`).then(({ data }) => data);

// success with code 201 and created entity as response data
export const createPlatform = (platform: New<SourcePlatform>) =>
  axios.post<SourcePlatform>(PLATFORMS, platform).then((res) => res.data);

// success with code 204 and therefore no response content
export const updatePlatform = (platform: SourcePlatform) =>
  axios.put<void>(`${PLATFORMS}/${platform.id}`, platform);

// success with code 204 and therefore no response content
export const deletePlatform = (id: number) =>
  axios.delete<void>(`${PLATFORMS}/${id}`);
