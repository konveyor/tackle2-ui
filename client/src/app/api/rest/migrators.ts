import axios from "axios";

import { MigratorConfig, New } from "../models";
import { hub } from "../rest";

const MIGRATORS = hub`/migrators`;

export const getMigrators = () =>
  axios.get<MigratorConfig[]>(MIGRATORS).then(({ data }) => data);

export const getMigratorById = (id: number | string) =>
  axios.get<MigratorConfig>(`${MIGRATORS}/${id}`).then(({ data }) => data);

export const createMigrator = (migrator: New<MigratorConfig>) => {
  return axios
    .post<MigratorConfig>(MIGRATORS, migrator)
    .then((res) => res.data);
};

export const updateMigrator = (migrator: MigratorConfig) => {
  return axios.put<void>(`${MIGRATORS}/${migrator.id}`, migrator);
};

export const deleteMigrator = (id: number) =>
  axios.delete<void>(`${MIGRATORS}/${id}`);
