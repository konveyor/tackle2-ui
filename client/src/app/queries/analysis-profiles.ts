import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { objectify } from "radash";

import { DEFAULT_REFETCH_INTERVAL } from "@app/Constants";
import { AnalysisProfile, New } from "@app/api/models";
import {
  createAnalysisProfile,
  deleteAnalysisProfile,
  getAnalysisProfileById,
  getAnalysisProfiles,
  updateAnalysisProfile,
} from "@app/api/rest";

export const ANALYSIS_PROFILES_QUERY_KEY = "analysis-profiles";
export const ANALYSIS_PROFILE_QUERY_KEY = "analysis-profile";

export const useFetchAnalysisProfiles = (
  refetchInterval: number | false = DEFAULT_REFETCH_INTERVAL
) => {
  const { data, isLoading, isSuccess, error, refetch } = useQuery({
    queryKey: [ANALYSIS_PROFILES_QUERY_KEY],
    queryFn: getAnalysisProfiles,
    onError: (error: AxiosError) => console.log(error),
    refetchInterval,
  });

  const analysisProfilesById = useMemo(() => {
    return !data ? {} : objectify(data, ({ id }) => id);
  }, [data]);

  return {
    analysisProfiles: data || [],
    analysisProfilesById,
    isFetching: isLoading,
    isSuccess,
    error,
    refetch,
  };
};

export const useFetchAnalysisProfileById = (
  id?: number | string,
  refetchInterval: number | false = DEFAULT_REFETCH_INTERVAL
) => {
  const { data, isLoading, error } = useQuery({
    queryKey: [ANALYSIS_PROFILE_QUERY_KEY, String(id)],
    queryFn: () =>
      id === undefined
        ? Promise.resolve(undefined)
        : getAnalysisProfileById(id),
    onError: (error: AxiosError) => console.log("error, ", error),
    enabled: id !== undefined,
    refetchInterval,
  });

  return {
    analysisProfile: data,
    isFetching: isLoading,
    fetchError: error,
  };
};

export const useCreateAnalysisProfileMutation = (
  onSuccess: (profile: AnalysisProfile) => void,
  onError: (err: AxiosError, errorPayload: New<AnalysisProfile>) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAnalysisProfile,
    onSuccess: async (profile) => {
      await Promise.allSettled([
        queryClient.invalidateQueries({
          queryKey: [ANALYSIS_PROFILES_QUERY_KEY],
        }),
      ]);
      onSuccess(profile);
    },
    onError: onError,
  });
};

export const useUpdateAnalysisProfileMutation = (
  onSuccess: (updatedProfile: AnalysisProfile) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAnalysisProfile,
    onSuccess: async (_, updatedProfile) => {
      await Promise.allSettled([
        queryClient.invalidateQueries({
          queryKey: [ANALYSIS_PROFILES_QUERY_KEY],
        }),
        queryClient.invalidateQueries({
          queryKey: [ANALYSIS_PROFILE_QUERY_KEY, String(updatedProfile.id)],
        }),
      ]);
      onSuccess(updatedProfile);
    },
    onError: onError,
  });
};

export const useDeleteAnalysisProfileMutation = (
  onSuccess: (profile: AnalysisProfile) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (profile: AnalysisProfile) => deleteAnalysisProfile(profile.id),
    onSuccess: async (_, profile) => {
      await Promise.allSettled([
        queryClient.invalidateQueries({
          queryKey: [ANALYSIS_PROFILES_QUERY_KEY],
        }),
        queryClient.invalidateQueries({
          queryKey: [ANALYSIS_PROFILE_QUERY_KEY, String(profile.id)],
        }),
      ]);
      onSuccess(profile);
    },
    onError: onError,
  });
};
