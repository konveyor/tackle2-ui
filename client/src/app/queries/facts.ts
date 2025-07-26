import { useQuery } from "@tanstack/react-query";

import { getFacts } from "@app/api/rest";
import { AxiosError } from "axios";
import { Fact } from "@app/api/models";
import { DEFAULT_REFETCH_INTERVAL } from "@app/Constants";

export const FactsQueryKey = "facts";

export const useFetchFacts = (
  applicationID: number | string | undefined,
  refetchInterval: number | false = DEFAULT_REFETCH_INTERVAL
) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [FactsQueryKey, applicationID],
    queryFn: () => getFacts(applicationID),
    enabled: !!applicationID,
    onError: (error: AxiosError) => console.log("error, ", error),
    select: (facts): Fact[] =>
      Object.keys(facts).map((fact) => ({ name: fact, data: facts[fact] })),
    refetchInterval,
  });

  return {
    facts: data || [],
    isFetching: isLoading,
    fetchError: error,
    refetch,
  };
};
