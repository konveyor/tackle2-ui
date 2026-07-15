import axios from "axios";

import { UnstructuredFact } from "../models";
import { hub } from "../rest";

export const getFacts = (id: number | string | undefined) =>
  // TODO: Address this when moving to structured facts api
  id
    ? axios
        .get<UnstructuredFact>(hub`/applications/${id}/facts`)
        .then((response) => response.data)
    : Promise.reject();
