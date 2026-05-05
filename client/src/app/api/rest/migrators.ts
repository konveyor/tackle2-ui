import axios from "axios";

import { MigratorConfig, New } from "../models";
import { hub } from "../rest";

const MIGRATORS = hub`/migrators`;

// In-memory store for local dev when Hub API doesn't have /migrators yet
let localStore: MigratorConfig[] = [];
let nextId = 1;
const USE_LOCAL_FALLBACK = true;

export const getMigrators = async (): Promise<MigratorConfig[]> => {
  if (USE_LOCAL_FALLBACK) return [...localStore];
  return axios.get<MigratorConfig[]>(MIGRATORS).then(({ data }) => data);
};

export const getMigratorById = async (
  id: number | string
): Promise<MigratorConfig | undefined> => {
  if (USE_LOCAL_FALLBACK) return localStore.find((m) => m.id === Number(id));
  return axios
    .get<MigratorConfig>(`${MIGRATORS}/${id}`)
    .then(({ data }) => data);
};

export const createMigrator = async (
  migrator: New<MigratorConfig>
): Promise<MigratorConfig> => {
  if (USE_LOCAL_FALLBACK) {
    const created: MigratorConfig = {
      ...migrator,
      id: nextId++,
    } as MigratorConfig;
    localStore.push(created);
    return created;
  }
  return axios
    .post<MigratorConfig>(MIGRATORS, migrator)
    .then((res) => res.data);
};

export const updateMigrator = async (
  migrator: MigratorConfig
): Promise<void> => {
  if (USE_LOCAL_FALLBACK) {
    const idx = localStore.findIndex((m) => m.id === migrator.id);
    if (idx !== -1) localStore[idx] = { ...migrator };
    return;
  }
  await axios.put<void>(`${MIGRATORS}/${migrator.id}`, migrator);
};

export const deleteMigrator = async (id: number): Promise<void> => {
  if (USE_LOCAL_FALLBACK) {
    localStore = localStore.filter((m) => m.id !== id);
    return;
  }
  await axios.delete<void>(`${MIGRATORS}/${id}`);
};
