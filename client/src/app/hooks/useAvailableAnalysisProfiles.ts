import { useMemo } from "react";

import { AnalysisProfile, Application, Archetype } from "@app/api/models";
import { useHasSomeScopes } from "@app/auth";
import { analysisProfileWriteScopes } from "@app/scopes";

/**
 * Hook to filter analysis profiles based on user role and selected applications.
 *
 * - Users with analysis profile write scopes (architect/admin): Can access all analysis profiles
 * - Users without write scopes (migrators): Can only access profiles attached to the selected applications' archetypes
 *   via archetype.profiles[].analysisProfile
 */
export const useAvailableAnalysisProfiles = (
  applications: Application[],
  allProfiles: AnalysisProfile[],
  archetypes: Archetype[]
): AnalysisProfile[] => {
  const canWriteProfiles = useHasSomeScopes(analysisProfileWriteScopes);

  return useMemo(() => {
    // Architects and admins can see all profiles
    if (canWriteProfiles) {
      return allProfiles;
    }

    // For migrators: filter to profiles attached to the selected applications' archetypes
    // 1. Get all archetype IDs from the selected applications
    const appArchetypeIds = new Set(
      applications.flatMap((app) => app.archetypes?.map((a) => a.id) ?? [])
    );

    // 2. Get analysis profile IDs from those archetypes' target profiles
    const profileIdsFromArchetypes = new Set(
      archetypes
        .filter((arch) => appArchetypeIds.has(arch.id))
        .flatMap(
          (arch) =>
            arch.profiles
              ?.map((p) => p.analysisProfile?.id)
              .filter((id): id is number => id !== undefined) ?? []
        )
    );

    // 3. Filter allProfiles to only include those in profileIdsFromArchetypes
    return allProfiles.filter((p) => profileIdsFromArchetypes.has(p.id));
  }, [canWriteProfiles, applications, allProfiles, archetypes]);
};
