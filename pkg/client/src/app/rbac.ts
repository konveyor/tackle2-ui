import { checkAccess } from "./common/rbac-utils";
import keycloak from "./keycloak";
interface IRBACProps {
  allowedRoles: string[];
  children: any;
}
export const RBAC = ({ allowedRoles, children }: IRBACProps) => {
  const token = keycloak.tokenParsed || undefined;

  //@ts-ignore
  const userScopes: string[] = token?.scope.split(" "),
    access = userScopes && checkAccess(userScopes, allowedRoles);

  return access && children;
};
