import axios from "axios";

import { Ref } from "@app/api/models";
import { User } from "@app/pages/user-management/types";

import { HEADERS, hub, template } from "../rest";

const USERS = hub`/users`;
const USER = hub`/users/{{id}}`;

/** Fields accepted by POST /users. Server sets everything else. */
export interface NewUser {
  login: string;
  name: string;
  password: string;
  email: string;
  roles?: Ref[];
}

export const getUsers = (): Promise<User[]> =>
  axios.get<User[]>(USERS, { headers: HEADERS.json }).then((r) => r.data);

export const getUserById = (id: number): Promise<User> =>
  axios
    .get<User>(template(USER, { id }), { headers: HEADERS.json })
    .then((r) => r.data);

export const createUser = (user: NewUser): Promise<User> =>
  axios.post<User>(USERS, user).then((r) => r.data);

export const updateUser = (user: User): Promise<void> =>
  axios.put<void>(template(USER, { id: user.id }), user).then(() => undefined);

export const deleteUser = (user: User): Promise<void> =>
  axios.delete<void>(template(USER, { id: user.id })).then(() => undefined);
