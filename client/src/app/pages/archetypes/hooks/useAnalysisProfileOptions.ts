import { useCallback, useMemo } from "react";

import { AnalysisProfile } from "@app/api/models";
import { OptionWithValue } from "@app/components/SimpleSelect";
import { useFetchAnalysisProfiles } from "@app/queries/analysis-profiles";

export interface UseAnalysisProfileOptionsResult {
  analysisProfiles: AnalysisProfile[];
  analysisProfileOptions: OptionWithValue<AnalysisProfile>[];
  isFetching: boolean;
  findProfileById: (id: number | undefined) => AnalysisProfile | undefined;
}

/**
 * Custom hook to fetch analysis profiles and provide them as select options.
 * Used in the target profile form for attaching an analysis profile.
 */
export const useAnalysisProfileOptions =
  (): UseAnalysisProfileOptionsResult => {
    const { analysisProfiles, isFetching } = useFetchAnalysisProfiles();

    const analysisProfileOptions = useMemo(
      () =>
        analysisProfiles.map((profile) => ({
          value: profile,
          toString: () => profile.name,
        })),
      [analysisProfiles]
    );

    const findProfileById = useCallback(
      (id: number | undefined) =>
        id === undefined
          ? undefined
          : analysisProfiles.find((p) => p.id === id),
      [analysisProfiles]
    );

    return {
      analysisProfiles,
      analysisProfileOptions,
      isFetching,
      findProfileById,
    };
  };
