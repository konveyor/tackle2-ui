import axios from "axios";

import { New } from "../models";
import { HEADERS, hub, template } from "../rest";
import { User } from "@app/pages/user-management/types";

const USERS = hub`/users`;
const USER = hub`/users/{{id}}`;

export const getUsers = (): Promise<User[]> =>
  axios.get<User[]>(USERS, { headers: HEADERS.json }).then((r) => r.data);

export const getUserById = (id: number): Promise<User> =>
  axios
    .get<User>(template(USER, { id }), { headers: HEADERS.json })
    .then((r) => r.data);

export const createUser = (user: New<User>): Promise<User> =>
  axios.post<User>(USERS, user).then((r) => r.data);

export const updateUser = (user: User): Promise<void> =>
  axios.put<void>(template(USER, { id: user.id }), user).then(() => undefined);

export const deleteUser = (user: User): Promise<void> =>
  axios.delete<void>(template(USER, { id: user.id })).then(() => undefined);
