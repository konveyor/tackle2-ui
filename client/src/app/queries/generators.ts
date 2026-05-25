import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { DEFAULT_REFETCH_INTERVAL } from "@app/Constants";
import { Generator } from "@app/api/models";
import {
  createGenerator,
  deleteGenerator,
  getGenerators,
  updateGenerator,
} from "@app/api/rest";

const GENERATORS_QUERY_KEY = "generators";
const GENERATOR_QUERY_KEY = "generator";

export const useFetchGenerators = (
  refetchInterval: number | false = DEFAULT_REFETCH_INTERVAL
) => {
  const { isLoading, isSuccess, error, refetch, data } = useQuery({
    queryKey: [GENERATORS_QUERY_KEY],
    queryFn: getGenerators,
    onError: (error: AxiosError) => console.log(error),
    refetchInterval,
  });

  return {
    generators: data || [],
    isLoading,
    isSuccess,
    fetchError: error,
    refetch,
  };
};

export const useCreateGeneratorMutation = (
  onSuccess: () => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createGenerator,
    onSuccess: () => {
      onSuccess();
      queryClient.invalidateQueries({ queryKey: [GENERATORS_QUERY_KEY] });
    },
    onError: onError,
  });
};

export const useUpdateGeneratorMutation = (
  onSuccess: (id: number) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateGenerator,
    onSuccess: (_, { id }) => {
      onSuccess(id);
      queryClient.invalidateQueries({ queryKey: [GENERATORS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [GENERATOR_QUERY_KEY, id] });
    },
    onError: onError,
  });
};

export const useDeleteGeneratorMutation = (
  onSuccess: (generator: Generator) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (generator: Generator) => deleteGenerator(generator.id),
    onSuccess: (_, generator) => {
      onSuccess(generator);
      queryClient.invalidateQueries({ queryKey: [GENERATORS_QUERY_KEY] });
      queryClient.invalidateQueries({
        queryKey: [GENERATOR_QUERY_KEY, generator.id],
      });
    },
    onError: onError,
  });
};
