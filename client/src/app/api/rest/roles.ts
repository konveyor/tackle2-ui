import axios from "axios";

import type { UserRole as Role } from "@app/api/models";

import { HEADERS, hub, template } from "../rest";

const ROLES = hub`/roles`;
const ROLE = hub`/roles/{{id}}`;

export const getRoles = (): Promise<Role[]> =>
  axios.get<Role[]>(ROLES, { headers: HEADERS.json }).then((r) => r.data);

export const getRoleById = (id: number): Promise<Role> =>
  axios
    .get<Role>(template(ROLE, { id }), { headers: HEADERS.json })
    .then((r) => r.data);

/** only name and permissions are sent; server fills in the rest. */
export const createRole = (
  role: Pick<Role, "name" | "permissions">
): Promise<Role> => axios.post<Role>(ROLES, role).then((r) => r.data);

export const updateRole = (role: Role): Promise<void> =>
  axios.put<void>(template(ROLE, { id: role.id }), role).then(() => undefined);

export const deleteRole = (role: Role): Promise<void> =>
  axios.delete<void>(template(ROLE, { id: role.id })).then(() => undefined);
