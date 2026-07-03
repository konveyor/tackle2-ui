import axios from "axios";

import { Scope } from "../models";
import { HEADERS, hub } from "../rest";

const SCOPES = hub`/auth/scopes`;

export const getScopes = (): Promise<Scope[]> =>
  axios.get<Scope[]>(SCOPES, { headers: HEADERS.json }).then((r) => r.data);
