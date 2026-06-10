import axios from "axios";

import { HEADERS, hub, template } from "../rest";
import { Token } from "@app/pages/user-management/types";

const TOKENS = hub`/auth/tokens`;
const TOKEN = hub`/auth/tokens/{{id}}`;

export const getTokens = (): Promise<Token[]> =>
  axios.get<Token[]>(TOKENS, { headers: HEADERS.json }).then((r) => r.data);

export const getTokenById = (id: number): Promise<Token> =>
  axios
    .get<Token>(template(TOKEN, { id }), { headers: HEADERS.json })
    .then((r) => r.data);

export const createToken = (token: Partial<Token>): Promise<Token> =>
  axios.post<Token>(TOKENS, token).then((r) => r.data);

export const deleteToken = (token: Token): Promise<void> =>
  axios.delete<void>(template(TOKEN, { id: token.id })).then(() => undefined);
