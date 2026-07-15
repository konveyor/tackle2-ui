import axios from "axios";

import { Proxy } from "../models";
import { hub } from "../rest";

const PROXIES = hub`/proxies`;

export const getProxies = () =>
  axios.get<Proxy[]>(PROXIES).then((response) => response.data);

export const updateProxy = (obj: Proxy) =>
  axios.put<void>(`${PROXIES}/${obj.id}`, obj);
