import axios from "axios";

import { Proxy } from "../models";
import { hub } from "../rest";

const PROXIES = hub`/proxies`;

export const getProxies = (): Promise<Proxy[]> =>
  axios.get(PROXIES).then((response) => response.data);

export const updateProxy = (obj: Proxy): Promise<Proxy> =>
  axios.put(`${PROXIES}/${obj.id}`, obj);
