import axios from "axios";

import { Identity, New } from "../models";
import { HEADERS, hub, template } from "../rest";

const IDENTITIES = hub`/identities`;
const IDENTITY = hub`/identities/{{id}}`;

export const getIdentities = () => {
  return axios
    .get<Identity[]>(IDENTITIES, { headers: HEADERS.json })
    .then((response) => response.data);
};

export const createIdentity = (identity: New<Identity>) => {
  return axios
    .post<Identity>(IDENTITIES, identity)
    .then((response) => response.data);
};

export const updateIdentity = (identity: Identity) => {
  return axios.put<void>(template(IDENTITY, { id: identity.id }), identity);
};

export const deleteIdentity = (identity: Identity) => {
  return axios.delete<void>(template(IDENTITY, { id: identity.id }));
};
