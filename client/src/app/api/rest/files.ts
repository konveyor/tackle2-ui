import axios, { AxiosProgressEvent } from "axios";

import { hub, template, HEADERS } from "../rest";
import { HubFile } from "../models";

export const FILE = hub`/files/{{id}}`;

export const createFile = (
  { file }: { file: File },
  onUploadProgress?: (file: File, percentComplete: number) => void
) => {
  const formData = new FormData();
  formData.append("file", file);

  const onUploadProgressHandler = !onUploadProgress
    ? undefined
    : (progressEvent: AxiosProgressEvent) => {
        if (progressEvent.lengthComputable && !!progressEvent.total) {
          const percent = Math.round(
            (progressEvent.loaded / progressEvent.total) * 100
          );
          onUploadProgress(file, percent);
        }
      };

  return axios
    .post<HubFile>(template(FILE, { id: file.name }), formData, {
      headers: HEADERS.file,
      onUploadProgress: onUploadProgressHandler,
    })
    .then((response) => response.data);
};

export const getTextFileById = (id: number) =>
  axios
    .get<string>(template(FILE, { id }), { headers: HEADERS.plain })
    .then((response) => response.data);
