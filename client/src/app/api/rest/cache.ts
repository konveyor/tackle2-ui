import axios from "axios";

import { Cache } from "../models";
import { hub } from "../rest";

const CACHE = hub`/cache/m2`;

export const getCache = () =>
  axios.get<Cache>(CACHE).then((response) => response.data);

export const deleteCache = () => axios.delete<void>(CACHE);
