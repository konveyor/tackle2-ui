import axios from "axios";

import { MigrationWave, New } from "../models";
import { hub, template } from "../rest";

const MIGRATION_WAVES = hub`/migrationwaves`;
const MIGRATION_WAVE = hub`/migrationwaves/{{id}}`;

export const getMigrationWaves = () =>
  axios.get<MigrationWave[]>(MIGRATION_WAVES).then((response) => response.data);

export const createMigrationWave = (obj: New<MigrationWave>) =>
  axios
    .post<MigrationWave>(MIGRATION_WAVES, obj)
    .then((response) => response.data);

export const deleteMigrationWave = (id: number) =>
  axios.delete<void>(template(MIGRATION_WAVE, { id }));

export const updateMigrationWave = (obj: MigrationWave) =>
  axios.put<void>(template(MIGRATION_WAVE, { id: obj.id }), obj);
