import { Permission } from "./types";

export const usePermissions = (): Permission[] => [
  {
    id: 1,
    createUser: "test",
    updateUser: "test",
    createTime: "2021-01-01",
    name: "test",
    scope: "test",
  },
  {
    id: 2,
    createUser: "test",
    updateUser: "test",
    createTime: "2021-01-01",
    name: "test",
    scope: "test",
  },
];
