import { useCallback, useMemo } from "react";

import { AnalysisProfile } from "@app/api/models";
import { FilterSelectOptionProps } from "@app/components/FilterToolbar/FilterToolbar";
import { useFetchAnalysisProfiles } from "@app/queries/analysis-profiles";

export interface UseAnalysisProfileOptionsResult {
  analysisProfiles: AnalysisProfile[];
  analysisProfileOptions: FilterSelectOptionProps[];
  isFetching: boolean;
  findProfileById: (id: number | undefined) => AnalysisProfile | undefined;
}

export const useAnalysisProfileOptions =
  (): UseAnalysisProfileOptionsResult => {
    const { analysisProfiles, isFetching } = useFetchAnalysisProfiles();

    const analysisProfileOptions: FilterSelectOptionProps[] = useMemo(
      () =>
        analysisProfiles.map((profile) => ({
          value: profile.id.toString(),
          label: profile.name,
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
