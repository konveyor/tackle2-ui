import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { getApplicationsWithSource, getGateways } from "@app/api/rest";

import { AGENTS_QUERY_KEY } from "./agents";
import { SKILL_CARDS_QUERY_KEY, SKILL_COLLECTIONS_QUERY_KEY } from "./skills";
import { WORKFLOWS_QUERY_KEY } from "./workflows";

export const GATEWAYS_QUERY_KEY = "gateways";
export const AGENTIC_APPLICATIONS_QUERY_KEY = "agenticApplications";

// ---------------------------------------------------------- Gateways

export const useFetchGateways = () => {
  const { isLoading, error, data, refetch } = useQuery({
    queryKey: [GATEWAYS_QUERY_KEY],
    queryFn: getGateways,
    onError: (error: AxiosError) => console.log(error),
  });
  return { gateways: data || [], isLoading, fetchError: error, refetch };
};

// ------------------------------------------- Applications inventory

/**
 * The shim's application inventory (Konveyor Hub or offline stub). Load
 * failures must not block pages that render without an application, so
 * callers get [] on error.
 */
export const useFetchAgenticApplications = ({ enabled = true } = {}) => {
  const { isLoading, error, data, refetch } = useQuery({
    queryKey: [AGENTIC_APPLICATIONS_QUERY_KEY],
    queryFn: getApplicationsWithSource,
    enabled,
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
