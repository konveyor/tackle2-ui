import axios from "axios";

import {
  HubRequestParams,
  New,
  Task,
  TaskDashboard,
  TaskQueue,
} from "../models";
import { HEADERS, getHubPaginatedResult, hub } from "../rest";

const TASKS = hub`/tasks`;

// ---------------------------------------
// Fetch hub paginated, sorted, filtered Tasks
//
export const getServerTasks = <D extends object>(
  params: HubRequestParams = {}
) => getHubPaginatedResult<Task<D>>(TASKS, params);

export function getTaskById<D extends object>(id: number) {
  return axios
    .get<Task<D>>(`${TASKS}/${id}`, {
      headers: { ...HEADERS.json },
      responseType: "json",
    })
    .then((response) => {
      return response.data;
    });
}

// ---------------------------------------
// Tasks functions
//
export function getTaskByIdAndFormat(
  id: number,
  format: "json" | "yaml",
  merged: boolean = false
): Promise<string> {
  const isYaml = format === "yaml";
  const headers = isYaml ? { ...HEADERS.yaml } : { ...HEADERS.json };
  const responseType = isYaml ? "text" : "json";

  let url = `${TASKS}/${id}`;
  if (merged) {
    url += "?merged=1";
  }

  return axios
    .get<Task<object> | string>(url, {
      headers: headers,
      responseType: responseType,
    })
    .then((response) => {
      return isYaml
        ? String(response.data ?? "")
        : JSON.stringify(response.data, undefined, 2);
    });
}

export function getTasksByIds<D extends object>(
  ids: number[],
  format: "json" | "yaml" = "json"
): Promise<Task<D>[]> {
  const isYaml = format === "yaml";
  const headers = isYaml ? { ...HEADERS.yaml } : { ...HEADERS.json };
  const responseType = isYaml ? "text" : "json";
  const filterParam = `id:(${ids.join("|")})`;

  return axios
    .get<Task<D>[]>(`${TASKS}`, {
      headers,
      responseType,
      params: {
        filter: filterParam,
      },
    })
    .then((response) => {
      return response.data;
    });
}

export const deleteTask = (id: number) => axios.delete<void>(`${TASKS}/${id}`);

export const cancelTask = (id: number) =>
  axios.put<void>(`${TASKS}/${id}/cancel`);

export const cancelTasks = (ids: number[]) =>
  axios.put<void>(`${TASKS}/cancel?filter=id:(${ids.join("|")})`);

export const createTask = <D, TaskType extends Task<D> = Task<D>>(
  task: New<TaskType>
) => axios.post<TaskType>(TASKS, task).then((response) => response.data);

export const updateTask = <D, TaskType extends Task<D> = Task<D>>(
  task: Partial<TaskType> & { id: number }
) => axios.patch<TaskType>(`${TASKS}/${task.id}`, task);

export const submitTask = <D, TaskType extends Task<D> = Task<D>>(
  task: TaskType
) => axios.put<void>(`${TASKS}/${task.id}/submit`, { id: task.id });

// ---------------------------------------
// Task Reports
//
export const getTasksDashboard = () =>
  axios
    .get<TaskDashboard[]>(`${TASKS}/report/dashboard`)
    .then((response) => response.data);

export const getTaskQueue = (addon?: string): Promise<TaskQueue> =>
  axios
    .get<TaskQueue>(`${TASKS}/report/queue`, { params: { addon } })
    .then(({ data }) => data);
