import axios from "axios";

import { Assessment, InitialAssessment } from "../models";
import { hub } from "../rest";

const ASSESSMENTS = hub`/assessments`;

export const getAssessments = () =>
  axios.get<Assessment[]>(ASSESSMENTS).then((response) => response.data);

export const getAssessmentsByItemId = (
  isArchetype: boolean,
  itemId?: number | string
): Promise<Assessment[]> => {
  if (!itemId) return Promise.resolve([]);
  if (isArchetype) {
    return axios
      .get<Assessment[]>(hub`/archetypes/${itemId}/assessments`)
      .then((response) => response.data);
  } else {
    return axios
      .get<Assessment[]>(hub`/applications/${itemId}/assessments`)
      .then((response) => response.data);
  }
};

export const createAssessment = (
  obj: InitialAssessment,
  isArchetype: boolean
): Promise<Assessment> => {
  if (isArchetype) {
    return axios
      .post<Assessment>(hub`/archetypes/${obj?.archetype?.id}/assessments`, obj)
      .then((response) => response.data);
  } else {
    return axios
      .post<Assessment>(
        hub`/applications/${obj?.application?.id}/assessments`,
        obj
      )
      .then((response) => response.data);
  }
};

export const updateAssessment = (obj: Assessment) =>
  axios.put<void>(`${ASSESSMENTS}/${obj.id}`, obj);

export const getAssessmentById = (id: number | string) =>
  axios
    .get<Assessment>(`${ASSESSMENTS}/${id}`)
    .then((response) => response.data);

export const deleteAssessment = (id: number) =>
  axios.delete<void>(`${ASSESSMENTS}/${id}`);
