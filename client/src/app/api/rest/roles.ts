import axios from "axios";

import { New } from "../models";
import { HEADERS, hub, template } from "../rest";
import { Role } from "@app/pages/user-management/types";

const ROLES = hub`/roles`;
const ROLE = hub`/roles/{{id}}`;

export const getRoles = (): Promise<Role[]> =>
  axios.get<Role[]>(ROLES, { headers: HEADERS.json }).then((r) => r.data);

export const getRoleById = (id: number): Promise<Role> =>
  axios
    .get<Role>(template(ROLE, { id }), { headers: HEADERS.json })
    .then((r) => r.data);

export const createRole = (role: New<Role>): Promise<Role> =>
  axios.post<Role>(ROLES, role).then((r) => r.data);

export const updateRole = (role: Role): Promise<void> =>
  axios.put<void>(template(ROLE, { id: role.id }), role).then(() => undefined);

export const deleteRole = (role: Role): Promise<void> =>
  axios.delete<void>(template(ROLE, { id: role.id })).then(() => undefined);
