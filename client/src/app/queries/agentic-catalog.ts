import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { getGateways } from "@app/api/rest";

export const GATEWAYS_QUERY_KEY = "gateways";

// ---------------------------------------------------------- Gateways

export const useFetchGateways = () => {
  const { isLoading, error, data, refetch } = useQuery({
    queryKey: [GATEWAYS_QUERY_KEY],
    queryFn: getGateways,
    onError: (error: AxiosError) => console.log(error),
  });
  return { gateways: data || [], isLoading, fetchError: error, refetch };
};
