import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { AxiosError } from "axios";
import { Generator } from "@app/api/models";
import {
  createGenerator,
  deleteGenerator,
  getGeneratorById,
  getGenerators,
  updateGenerator,
} from "@app/api/rest/generators";
import { DEFAULT_REFETCHING_INTERVAL } from "@app/Constants";

export const GENERATORS_QUERY_KEY = "generators";
export const GENERATOR_QUERY_KEY = "generator";

export const useFetchGenerators = (
  refetchInterval:
    | number
    | false
    | (() => number | false) = DEFAULT_REFETCHING_INTERVAL
) => {
  const { isLoading, isSuccess, error, refetch, data } = useQuery({
    queryKey: [GENERATORS_QUERY_KEY],
    queryFn: getGenerators,
    onError: (error: AxiosError) => console.log(error),
    refetchInterval,
  });

  return {
    generators: data,
    isLoading,
    isSuccess,
    error,
    refetch,
  };
};

export const useFetchGeneratorById = (id?: number | string) => {
  const { data, isLoading, error } = useQuery({
    queryKey: [GENERATOR_QUERY_KEY, id],
    queryFn: () =>
      id === undefined ? Promise.resolve(undefined) : getGeneratorById(id),
    onError: (error: AxiosError) => console.log("error, ", error),
    enabled: id !== undefined,
  });

  return {
    generator: data,
    isLoading,
    fetchError: error,
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
      queryClient.invalidateQueries([GENERATORS_QUERY_KEY]);
      queryClient.invalidateQueries([GENERATOR_QUERY_KEY, id]);
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
      queryClient.invalidateQueries([GENERATORS_QUERY_KEY]);
      queryClient.invalidateQueries([GENERATOR_QUERY_KEY, generator.id]);
    },
    onError: onError,
  });
};
