import axios, { AxiosPromise } from "axios";

import { New, Taskgroup } from "../models";
import { HEADERS, hub } from "../rest";

const TASKGROUPS = hub`/taskgroups`;

export const createTaskgroup = (obj: New<Taskgroup>) =>
  axios.post<Taskgroup>(TASKGROUPS, obj).then((response) => response.data);

export const submitTaskgroup = (obj: Taskgroup) =>
  axios
    .put<void>(`${TASKGROUPS}/${obj.id}/submit`, obj)
    .then((response) => response.data);

export const deleteTaskgroup = (id: number): AxiosPromise =>
  axios.delete(`${TASKGROUPS}/${id}`);

// returns a 204 and no content with a successful upload
export const uploadFileTaskgroup = ({
  id,
  path,
  file,
}: {
  id: number;
  path: string;
  file: File;
}) => {
  const formData = new FormData();
  formData.append("file", file);
  return axios.post<void>(`${TASKGROUPS}/${id}/bucket/${path}`, formData, {
    headers: HEADERS.form,
  });
};

export const removeFileTaskgroup = ({
  id,
  path,
}: {
  id: number;
  path: string;
}) => {
  return axios.delete<Taskgroup>(`${TASKGROUPS}/${id}/bucket/${path}`);
};
