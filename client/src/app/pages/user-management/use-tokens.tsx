import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { getTokens } from "@app/api/rest";

import { Token } from "./types";

export const TokensQueryKey = "tokens";

export const useFetchTokens = () => {
  const { data, isLoading, error } = useQuery<Token[], AxiosError>({
    queryKey: [TokensQueryKey],
    queryFn: getTokens,
  });

  return {
    tokens: data ?? [],
    isFetching: isLoading,
    fetchError: error,
  };
};
