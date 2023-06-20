import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getFacts } from "@app/api/rest";
import { AxiosError } from "axios";
import { Fact } from "@app/api/models";

export const FactsQueryKey = "facts";

export const useFetchFacts = (applicationID: number | string) => {
  const { data, isLoading, error, refetch } = useQuery<Fact>(
    [FactsQueryKey],
    async () => (await getFacts(applicationID)).data,
    {
      onError: (error) => console.log("error, ", error),
    }
  );
  console.log("facts async", data);

  return {
    facts: data || {},
    isFetching: isLoading,
    fetchError: error,
    refetch,
  };
};
