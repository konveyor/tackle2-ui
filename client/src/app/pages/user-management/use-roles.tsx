import { Role } from "./types";

export const useRoles = (): Role[] => [
  {
    id: 1,
    createUser: "test",
    updateUser: "test",
    createTime: "2021-01-01",
    name: "test",
    permissions: [
      {
        id: 1,
        name: "test",
      },
    ],
  },
  {
    id: 2,
    createUser: "test",
    updateUser: "test",
    createTime: "2021-01-01",
    name: "test",
    permissions: [
      {
        id: 1,
        name: "test",
      },
    ],
  },
];
