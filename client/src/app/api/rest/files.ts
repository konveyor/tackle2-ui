import axios from "axios";

import { hub, template, HEADERS } from "../rest";
import { HubFile } from "../models";

export const FILE = hub`/files/{{id}}`;

export const createFile = ({ file }: { file: File }) => {
  const formData = new FormData();
  formData.append("file", file);
  return axios
    .post<HubFile>(template(FILE, { id: file.name }), formData, {
      headers: HEADERS.file,
    })
    .then((response) => response.data);
};

export const getTextFileById = (id: number) =>
  axios
    .get<string>(template(FILE, { id }), { headers: HEADERS.plain })
    .then((response) => response.data);
