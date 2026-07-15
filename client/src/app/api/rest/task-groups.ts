import axios from "axios";

import { New, Taskgroup } from "../models";
import { HEADERS, hub } from "../rest";

const TASKGROUPS = hub`/taskgroups`;

export const createTaskgroup = (obj: New<Taskgroup>) =>
  axios.post<Taskgroup>(TASKGROUPS, obj).then((response) => response.data);

export const submitTaskgroup = (obj: Taskgroup) =>
  axios.put<void>(`${TASKGROUPS}/${obj.id}/submit`, obj);

export const deleteTaskgroup = (id: number) =>
  axios.delete<void>(`${TASKGROUPS}/${id}`);

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
}) => axios.delete<void>(`${TASKGROUPS}/${id}/bucket/${path}`);
