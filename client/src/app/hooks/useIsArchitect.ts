import { useHasRealmRoles } from "@app/auth";

/**
 * Hook to check if the current user has architect-level access.
 * Architects and admins can access all analysis profiles.
 * Migrators have restricted access to profiles attached to their applications' archetypes.
 */
export const useIsArchitect = (): boolean => {
  return useHasRealmRoles(["tackle-architect", "tackle-admin"]);
};
