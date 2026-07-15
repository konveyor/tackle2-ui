import axios from "axios";

import { Questionnaire } from "../models";
import { hub } from "../rest";

export const QUESTIONNAIRES = hub`/questionnaires`;

export const getQuestionnaires = (): Promise<Questionnaire[]> =>
  axios.get(QUESTIONNAIRES).then((response) => response.data);

export const getQuestionnaireById = <T>(id: number | string): Promise<T> =>
  axios.get(`${QUESTIONNAIRES}/${id}`).then((response) => response.data);

export const createQuestionnaire = (
  obj: Questionnaire
): Promise<Questionnaire> =>
  axios.post(`${QUESTIONNAIRES}`, obj).then((response) => response.data);

export const updateQuestionnaire = (
  obj: Questionnaire
): Promise<Questionnaire> => axios.put(`${QUESTIONNAIRES}/${obj.id}`, obj);

export const deleteQuestionnaire = (id: number): Promise<Questionnaire> =>
  axios.delete(`${QUESTIONNAIRES}/${id}`);
