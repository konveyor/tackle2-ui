import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { DEFAULT_REFETCH_INTERVAL } from "@app/Constants";
import { getGateways } from "@app/api/rest";
import {
  AGENTIC_QUERY_RETRY,
  pollUnlessErrored,
} from "@app/queries/agentic-polling";

export const GATEWAYS_QUERY_KEY = "gateways";

// ---------------------------------------------------------- Gateways

export const useFetchGateways = (
  refetchInterval: number | false = DEFAULT_REFETCH_INTERVAL
) => {
  const { isLoading, error, data, refetch } = useQuery({
    queryKey: [GATEWAYS_QUERY_KEY],
    queryFn: getGateways,
    onError: (error: AxiosError) => console.log(error),
    // Verification flips Ready on its own schedule — keep the page live.
    retry: AGENTIC_QUERY_RETRY,
    refetchInterval: (_data, query) =>
      pollUnlessErrored(query, refetchInterval),
  });
  return { gateways: data || [], isLoading, fetchError: error, refetch };
};
