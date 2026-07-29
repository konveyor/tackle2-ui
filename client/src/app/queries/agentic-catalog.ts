import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import type { SeedResult } from "@app/api/agentic/contract";
import {
  getApplicationsWithSource,
  getImagesWithSource,
  getProviders,
  loadDefaults,
} from "@app/api/rest";

import { AGENTS_QUERY_KEY } from "./agents";
import { PLAYBOOKS_QUERY_KEY } from "./playbooks";
import { SKILL_CARDS_QUERY_KEY, SKILL_COLLECTIONS_QUERY_KEY } from "./skills";

export const PROVIDERS_QUERY_KEY = "llmProviders";
export const IMAGES_QUERY_KEY = "agentImages";
export const AGENTIC_APPLICATIONS_QUERY_KEY = "agenticApplications";

// --------------------------------------------------------- Providers

export const useFetchProviders = () => {
  const { isLoading, error, data, refetch } = useQuery({
    queryKey: [PROVIDERS_QUERY_KEY],
    queryFn: getProviders,
    onError: (error: AxiosError) => console.log(error),
  });
  return { providers: data || [], isLoading, fetchError: error, refetch };
};

// ----------------------------------------------------------- Images

export const useFetchImagesWithSource = () => {
  const { isLoading, error, data } = useQuery({
    queryKey: [IMAGES_QUERY_KEY],
    queryFn: getImagesWithSource,
    onError: (error: AxiosError) => console.log(error),
  });
  return {
    images: data?.images || [],
    source: data?.source ?? null,
    isLoading,
    fetchError: error,
  };
};

// ------------------------------------------- Applications inventory

/**
 * The shim's application inventory (Konveyor Hub or offline stub). Load
 * failures must not block pages that render without an application, so
 * callers get [] on error.
 */
export const useFetchAgenticApplications = () => {
  const { isLoading, error, data, refetch } = useQuery({
    queryKey: [AGENTIC_APPLICATIONS_QUERY_KEY],
    queryFn: getApplicationsWithSource,
    onError: (error: AxiosError) => console.log(error),
  });
  return {
    applications: data?.applications || [],
    source: data?.source ?? null,
    endpoint: data?.endpoint ?? "",
    isLoading,
    fetchError: error,
    refetch,
  };
};

// -------------------------------------------------- Seeded defaults

export const useLoadDefaultsMutation = (
  onSuccess: (results: SeedResult[]) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: loadDefaults,
    onSuccess: (data) => {
      onSuccess(data);
      queryClient.invalidateQueries({ queryKey: [AGENTS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [SKILL_CARDS_QUERY_KEY] });
      queryClient.invalidateQueries({
        queryKey: [SKILL_COLLECTIONS_QUERY_KEY],
      });
      queryClient.invalidateQueries({ queryKey: [PROVIDERS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [PLAYBOOKS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [IMAGES_QUERY_KEY] });
    },
    onError,
  });
};
