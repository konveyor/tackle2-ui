import axios from "axios";

import { hub } from "../rest";

export const getFacts = (id: number | string) =>
  axios
    .get<Record<string, unknown>>(hub`/applications/${id}/facts`)
    .then((response) => response.data);
