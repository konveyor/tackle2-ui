import axios from "axios";

import type {
  PersonalAccessToken,
  Token,
} from "@app/pages/user-management/types";

import { HEADERS, hub, template } from "../rest";

const TOKENS = hub`/auth/tokens`;
const TOKEN = hub`/auth/tokens/{{id}}`;

export const getTokens = (): Promise<Token[]> =>
  axios.get<Token[]>(TOKENS, { headers: HEADERS.json }).then((r) => r.data);

export const getTokenById = (id: number): Promise<Token> =>
  axios
    .get<Token>(template(TOKEN, { id }), { headers: HEADERS.json })
    .then((r) => r.data);

/** creates an api-key token. Returns PAT with one-time plaintext secret. */
export const createToken = (
  token: Pick<PersonalAccessToken, "lifespan" | "expiration">
): Promise<PersonalAccessToken> =>
  axios.post<PersonalAccessToken>(TOKENS, token).then((r) => r.data);

/** revokes a token. */
export const deleteToken = (token: Token): Promise<void> =>
  axios.delete<void>(template(TOKEN, { id: token.id })).then(() => undefined);
