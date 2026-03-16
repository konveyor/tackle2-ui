import { useMemo } from "react";

import { AnalysisProfile, Application, Archetype } from "@app/api/models";

import { useIsArchitect } from "./useIsArchitect";

/**
 * Hook to filter analysis profiles based on user role and selected applications.
 *
 * - Architects/Admins: Can access all analysis profiles
 * - Migrators: Can only access profiles attached to the selected applications' archetypes
 *   via archetype.profiles[].analysisProfile
 */
export const useAvailableAnalysisProfiles = (
  applications: Application[],
  allProfiles: AnalysisProfile[],
  archetypes: Archetype[]
): AnalysisProfile[] => {
  const isArchitect = useIsArchitect();

  return useMemo(() => {
    // Architects and admins can see all profiles
    if (isArchitect) {
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
  }, [isArchitect, applications, allProfiles, archetypes]);
};
