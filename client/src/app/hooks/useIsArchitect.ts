import { isAuthRequired } from "@app/Constants";
import keycloak from "@app/keycloak";

/**
 * Hook to check if the current user has architect-level access.
 * Architects and admins can access all analysis profiles.
 * Migrators have restricted access to profiles attached to their applications' archetypes.
 */
export const useIsArchitect = (): boolean => {
  if (!isAuthRequired) {
    // When auth is not required, grant full access
    return true;
  }

  const token = keycloak.tokenParsed;
  const userRoles = token?.realm_access?.roles || [];
  return (
    userRoles.includes("tackle-architect") || userRoles.includes("tackle-admin")
  );
};
