import { Token } from "./types";

export const useTokens = (): Token[] => [
  {
    id: 1,
    createUser: "test",
    updateUser: "test",
    createTime: "2021-01-01",
    kind: "test",
    authId: "test",
    subject: "test",
    scopes: "test",
    issued: "2021-01-01",
    expiration: "2021-01-01",
    lifespan: 1,
    grant: {
      id: 1,
      name: "test",
    },
    task: {
      id: 1,
      name: "test",
    },
    user: {
      id: 1,
      name: "test",
    },
    idpIdentity: {
      id: 1,
      name: "test",
    },
    idpClient: {
      id: 1,
      name: "test",
    },
  },
  {
    id: 2,
    createUser: "test",
    updateUser: "test",
    createTime: "2021-01-01",
    kind: "test",
    authId: "test",
    subject: "test",
    scopes: "test",
    issued: "2021-01-01",
    expiration: "2021-01-01",
    lifespan: 1,
    grant: {
      id: 1,
      name: "test",
    },
    task: {
      id: 1,
      name: "test",
    },
    user: {
      id: 1,
      name: "test",
    },
    idpIdentity: {
      id: 1,
      name: "test",
    },
    idpClient: {
      id: 1,
      name: "test",
    },
  },
];
