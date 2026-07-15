import axios from "axios";

import { Questionnaire } from "../models";
import { hub } from "../rest";

export const QUESTIONNAIRES = hub`/questionnaires`;

export const getQuestionnaires = () =>
  axios.get<Questionnaire[]>(QUESTIONNAIRES).then((response) => response.data);

export const getQuestionnaireById = (id: number | string) =>
  axios
    .get<Questionnaire>(`${QUESTIONNAIRES}/${id}`)
    .then((response) => response.data);

export const createQuestionnaire = (obj: Questionnaire) =>
  axios
    .post<Questionnaire>(QUESTIONNAIRES, obj)
    .then((response) => response.data);

export const updateQuestionnaire = (obj: Questionnaire) =>
  axios.put<void>(`${QUESTIONNAIRES}/${obj.id}`, obj);

export const deleteQuestionnaire = (id: number) =>
  axios.delete<void>(`${QUESTIONNAIRES}/${id}`);
