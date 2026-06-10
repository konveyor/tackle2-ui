import axios from "axios";

import { HEADERS, hub, template } from "../rest";
import { Permission } from "@app/pages/user-management/types";

const PERMISSIONS = hub`/permissions`;
const PERMISSION = hub`/permissions/{{id}}`;

export const getPermissions = (): Promise<Permission[]> =>
  axios
    .get<Permission[]>(PERMISSIONS, { headers: HEADERS.json })
    .then((r) => r.data);

export const getPermissionById = (id: number): Promise<Permission> =>
  axios
    .get<Permission>(template(PERMISSION, { id }), { headers: HEADERS.json })
    .then((r) => r.data);
