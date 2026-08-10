import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { getGateways } from "@app/api/rest";

import { AGENTS_QUERY_KEY } from "./agents";
import { SKILL_CARDS_QUERY_KEY, SKILL_COLLECTIONS_QUERY_KEY } from "./skills";
import { WORKFLOWS_QUERY_KEY } from "./workflows";

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
