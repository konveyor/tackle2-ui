import { Ref } from "@app/api/models";

export interface UserManagementResource {
  id: number;
  createUser: string;
  updateUser: string;
  createTime: string; // ISO 8601 datetime
}

/** User REST resource. */
export interface User extends UserManagementResource {
  subject: string;
  login: string; // required, immutable after creation
  name: string;
  password: string; // required on create (max 72 chars), masked in responses
  email: string; // required
  roles: Ref[];
  tokens: Ref[];
}

/** Role REST resource. */
export interface Role extends UserManagementResource {
  name: string; // required
  permissions: Ref[];
}

/** Permission REST resource (read-only via API). */
export interface Permission extends UserManagementResource {
  name: string; // required
  scope: string; // required, unique
}

/** Response from GET /auth/me. */
export interface AuthMe {
  user?: User;
  scopes: string[];
}

/** Token REST resource (returned by GET). */
export interface Token extends UserManagementResource {
  kind: string; // "api-key" | "access"
  authId?: string;
  subject?: string;
  scopes?: string[];
  issued?: string; // ISO 8601
  expiration?: string; // ISO 8601
  lifespan?: number; // remaining hours until expiration
  grant?: Ref | null;
  task?: Ref | null;
  user?: Ref | null;
  idpIdentity?: Ref | null;
  idpClient?: Ref | null;
}

/**
 * PAT (Personal Access Token) — request body for POST,
 * and the response from POST (which includes the one-time raw secret).
 * Also aliased as APIKey.
 */
export interface PersonalAccessToken {
  id?: number;
  lifespan?: number; // requested lifespan in hours (default: ~87600)
  expiration?: string; // ISO 8601, alternative to lifespan
  token?: string; // raw secret, only present in the create response
}

/** Grant REST resource. */
export interface Grant extends UserManagementResource {
  kind: string;
  authId: string;
  subject: string;
  scopes: string;
  issued: string; // ISO 8601
  expiration: string; // ISO 8601
}
