import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getFacts } from "@app/api/rest";
import { AxiosError } from "axios";
import { Application, Fact } from "@app/api/models";
import { ApplicationsQueryKey } from "./applications";

export const FactsQueryKey = "facts";

export const useFetchFacts = (applicationID: number | string | undefined) => {
  const { data, isLoading, error, refetch } = useQuery(
    [FactsQueryKey, applicationID],
    {
      queryFn: async () => await getFacts(applicationID),
      enabled: !!applicationID,
      onError: (error: AxiosError) => console.log("error, ", error),
    }
  );

  return {
    facts: data || {},
    isFetching: isLoading,
    fetchError: error,
    refetch,
  };
};
