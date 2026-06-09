import { User } from "./types";

export const useUsers = (): User[] => [
  {
    id: 1,
    createUser: "test1",
    updateUser: "test1",
    createTime: "2021-01-01",
    subject: "test1",
    login: "test",
    name: "test1",
    password: "test1",
    email: "test1",
    roles: [],
    tokens: [],
  },
  {
    id: 2,
    createUser: "test2",
    updateUser: "test2",
    createTime: "2021-01-01",
    subject: "test2",
    login: "test2",
    name: "test2",
    password: "test2",
    email: "test2",
    roles: [],
    tokens: [],
  },
];
