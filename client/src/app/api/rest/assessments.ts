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
      .get(hub`/archetypes/${itemId}/assessments`)
      .then((response) => response.data);
  } else {
    return axios
      .get(hub`/applications/${itemId}/assessments`)
      .then((response) => response.data);
  }
};

export const createAssessment = (
  obj: InitialAssessment,
  isArchetype: boolean
): Promise<Assessment> => {
  if (isArchetype) {
    return axios
      .post(hub`/archetypes/${obj?.archetype?.id}/assessments`, obj)
      .then((response) => response.data);
  } else {
    return axios
      .post(hub`/applications/${obj?.application?.id}/assessments`, obj)
      .then((response) => response.data);
  }
};

export const updateAssessment = (obj: Assessment): Promise<Assessment> => {
  return axios
    .put(`${ASSESSMENTS}/${obj.id}`, obj)
    .then((response) => response.data);
};

export const getAssessmentById = (id: number | string): Promise<Assessment> => {
  return axios.get(`${ASSESSMENTS}/${id}`).then((response) => response.data);
};

export const deleteAssessment = (id: number) => {
  return axios.delete<void>(`${ASSESSMENTS}/${id}`);
};
