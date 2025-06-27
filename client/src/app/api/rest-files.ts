import axios from "axios";

import { HUB, HEADERS } from "./rest";
import { HubFile, IReadFile } from "./models";

export const FILES = HUB + "/files";

export const createFile = ({
  formData,
  file,
}: {
  formData: FormData;
  file: IReadFile;
}) =>
  axios
    .post<HubFile>(`${FILES}/${file.fileName}`, formData, {
      headers: HEADERS.file,
    })
    .then((response) => response.data);

export const getTextFileById = (id: number) =>
  axios
    .get<string>(`${FILES}/${id}`, { headers: HEADERS.plain })
    .then((response) => response.data);
