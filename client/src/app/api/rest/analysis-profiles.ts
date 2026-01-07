import axios from "axios";

import { AnalysisProfile, New } from "../models";
import { hub } from "../rest";

const ANALYSIS_PROFILES = hub`/analysis/profiles`;

export const getAnalysisProfiles = (): Promise<AnalysisProfile[]> =>
  axios.get(ANALYSIS_PROFILES).then(({ data }) => data);

export const getAnalysisProfileById = (
  id: number | string
): Promise<AnalysisProfile> =>
  axios.get(`${ANALYSIS_PROFILES}/${id}`).then(({ data }) => data);

// success with code 201 and created entity as response data
export const createAnalysisProfile = (profile: New<AnalysisProfile>) =>
  axios
    .post<AnalysisProfile>(ANALYSIS_PROFILES, profile)
    .then((res) => res.data);

// success with code 204 and therefore no response content
export const updateAnalysisProfile = (profile: AnalysisProfile) =>
  axios.put<void>(`${ANALYSIS_PROFILES}/${profile.id}`, profile);

// success with code 204 and therefore no response content
export const deleteAnalysisProfile = (id: number) =>
  axios.delete<void>(`${ANALYSIS_PROFILES}/${id}`);
