import axios from "axios";

import { HEADERS } from "../rest";
import { HubFile } from "../models";

export const FILES = "/hub/files";

export const createFile = ({ file }: { file: File }) => {
  const formData = new FormData();
  formData.append("file", file);
  return axios
    .post<HubFile>(`${FILES}/${file.name}`, formData, {
      headers: HEADERS.file,
    })
    .then((response) => response.data);
};

export const getTextFileById = (id: number) =>
  axios
    .get<string>(`${FILES}/${id}`, { headers: HEADERS.plain })
    .then((response) => response.data);
