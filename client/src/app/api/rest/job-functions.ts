import axios from "axios";

import { JobFunction, New } from "../models";
import { hub } from "../rest";

const JOB_FUNCTIONS = hub`/jobfunctions`;

export const getJobFunctions = () =>
  axios.get<JobFunction[]>(JOB_FUNCTIONS).then((response) => response.data);

export const createJobFunction = (obj: New<JobFunction>) =>
  axios.post<JobFunction>(JOB_FUNCTIONS, obj).then((response) => response.data);

export const updateJobFunction = (obj: JobFunction) =>
  axios.put<void>(`${JOB_FUNCTIONS}/${obj.id}`, obj);

export const deleteJobFunction = (id: number) =>
  axios.delete<void>(`${JOB_FUNCTIONS}/${id}`);
