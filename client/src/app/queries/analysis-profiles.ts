import { useMemo } from "react";
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import { objectify } from "radash";

import { DEFAULT_REFETCH_INTERVAL } from "@app/Constants";
import { AnalysisProfile, New, Ref, UploadFile } from "@app/api/models";
import {
  createAnalysisProfile,
  deleteAnalysisProfile,
  getAnalysisProfileById,
  getAnalysisProfiles,
  getTextFileById,
  updateAnalysisProfile,
} from "@app/api/rest";

export const ANALYSIS_PROFILES_QUERY_KEY = "analysis-profiles";
export const ANALYSIS_PROFILE_QUERY_KEY = "analysis-profile";
export const CUSTOM_RULES_FILES_QUERY_KEY = "custom-rules-files";

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
  onSuccess?: (profile: AnalysisProfile) => void,
  onError?: (err: AxiosError, errorPayload: New<AnalysisProfile>) => void
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
      onSuccess?.(profile);
    },
    onError: onError,
  });
};

export const useUpdateAnalysisProfileMutation = (
  onSuccess?: (updatedProfile: AnalysisProfile) => void,
  onError?: (err: AxiosError, errorPayload: AnalysisProfile) => void
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
        queryClient.invalidateQueries({
          queryKey: [CUSTOM_RULES_FILES_QUERY_KEY, String(updatedProfile.id)],
        }),
      ]);
      onSuccess?.(updatedProfile);
    },
    onError: onError,
  });
};

export const useDeleteAnalysisProfileMutation = (
  onSuccess?: (profile: AnalysisProfile) => void,
  onError?: (err: AxiosError) => void
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
        queryClient.invalidateQueries({
          queryKey: [CUSTOM_RULES_FILES_QUERY_KEY, String(profile.id)],
        }),
      ]);
      onSuccess?.(profile);
    },
    onError: onError,
  });
};

/**
 * Fetches custom rules files referenced by an AnalysisProfile and returns them
 * as UploadFile items with their contents loaded for label parsing.
 */
export const useFetchCustomRulesFiles = (
  analysisProfile: AnalysisProfile | null | undefined
) => {
  // Memoize fileRefs to avoid recreating the array on every render
  const fileRefs: Ref[] = useMemo(
    () => analysisProfile?.rules?.files ?? [],
    [analysisProfile?.rules?.files]
  );

  const fileQueries = useQueries({
    queries: fileRefs.map((ref) => ({
      queryKey: [
        CUSTOM_RULES_FILES_QUERY_KEY,
        String(analysisProfile?.id),
        ref.id,
      ],
      queryFn: () => getTextFileById(ref.id),
      enabled: !!analysisProfile,
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    })),
  });

  const isLoading = fileQueries.some((q) => q.isLoading);
  const isFetching = fileQueries.some((q) => q.isFetching);
  const isError = fileQueries.some((q) => q.isError);
  const errors = fileQueries
    .filter((q) => q.error)
    .map((q) => q.error as AxiosError);

  // Convert fetched file contents to UploadFile format
  const customRulesFiles: UploadFile[] = useMemo(() => {
    return fileRefs.map((ref, index) => {
      const query = fileQueries[index];
      const contents = query.data;
      const hasError = query.isError;

      // Create a File object from the content (or empty if not loaded yet)
      const fileContent = contents ?? "";
      const blob = new Blob([fileContent], { type: "text/plain" });
      const file = new File([blob], ref.name, { type: "text/plain" });

      return {
        fileId: ref.id,
        fileName: ref.name,
        fullFile: file,
        uploadProgress: 100,
        status: hasError ? "failed" : "uploaded",
        contents: contents,
        responseID: ref.id,
        ...(hasError && { loadError: "Failed to load file contents" }),
      } satisfies UploadFile;
    });
  }, [fileRefs, fileQueries]);

  return {
    customRulesFiles,
    isLoading,
    isFetching,
    isError,
    errors,
  };
};
