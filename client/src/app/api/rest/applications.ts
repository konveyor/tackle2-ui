import axios from "axios";

import { Application, JsonDocument, New } from "../models";
import { hub, template } from "../rest";

const APPLICATIONS = hub`/applications`;
const APPLICATION_MANIFEST = hub`/applications/{{id}}/manifest`;

export const createApplication = (application: New<Application>) =>
  axios
    .post<Application>(`${APPLICATIONS}`, application)
    .then((response) => response.data);

export const deleteApplication = (id: number) =>
  axios.delete<void>(`${APPLICATIONS}/${id}`);

export const deleteBulkApplications = (ids: number[]) =>
  axios.delete<void>(APPLICATIONS, { data: ids });

export const getApplicationById = (id: number | string) =>
  axios
    .get<Application>(`${APPLICATIONS}/${id}`)
    .then((response) => response.data);

export const getApplicationManifest = (applicationId: number | string) =>
  axios
    .get<JsonDocument>(template(APPLICATION_MANIFEST, { id: applicationId }))
    .then((response) => response.data);

export const getApplications = () =>
  axios.get<Application[]>(APPLICATIONS).then((response) => response.data);

export const updateApplication = (obj: Application) =>
  axios.put<void>(`${APPLICATIONS}/${obj.id}`, obj);
