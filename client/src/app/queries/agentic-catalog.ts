import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { DEFAULT_REFETCH_INTERVAL } from "@app/Constants";
import { getGateways } from "@app/api/rest";

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
    refetchInterval,
  });
  return { gateways: data || [], isLoading, fetchError: error, refetch };
};
