import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { DEFAULT_REFETCH_INTERVAL } from "@app/Constants";
import { MigratorConfig } from "@app/api/models";
import {
  createMigrator,
  deleteMigrator,
  getMigratorById,
  getMigrators,
  updateMigrator,
} from "@app/api/rest";

export const MIGRATORS_QUERY_KEY = "migrators";
export const MIGRATOR_QUERY_KEY = "migrator";

export const useFetchMigrators = (
  refetchInterval: number | false = DEFAULT_REFETCH_INTERVAL
) => {
  const { isLoading, isSuccess, error, refetch, data } = useQuery({
    queryKey: [MIGRATORS_QUERY_KEY],
    queryFn: getMigrators,
    onError: (error: AxiosError) => console.log(error),
    refetchInterval,
  });

  return {
    migrators: data || [],
    isLoading,
    isSuccess,
    fetchError: error,
    refetch,
  };
};

export const useFetchMigratorById = (id?: number | string) => {
  const { data, isLoading, error } = useQuery({
    queryKey: [MIGRATOR_QUERY_KEY, id],
    queryFn: () =>
      id === undefined ? Promise.resolve(undefined) : getMigratorById(id),
    onError: (error: AxiosError) => console.log("error, ", error),
    enabled: id !== undefined,
  });

  return {
    migrator: data,
    isLoading,
    fetchError: error,
  };
};

export const useCreateMigratorMutation = (
  onSuccess: () => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createMigrator,
    onSuccess: () => {
      onSuccess();
      queryClient.invalidateQueries({ queryKey: [MIGRATORS_QUERY_KEY] });
    },
    onError: onError,
  });
};

export const useUpdateMigratorMutation = (
  onSuccess: (id: number) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateMigrator,
    onSuccess: (_, { id }) => {
      onSuccess(id);
      queryClient.invalidateQueries({ queryKey: [MIGRATORS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [MIGRATOR_QUERY_KEY, id] });
    },
    onError: onError,
  });
};

export const useDeleteMigratorMutation = (
  onSuccess: (migrator: MigratorConfig) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (migrator: MigratorConfig) => deleteMigrator(migrator.id),
    onSuccess: (_, migrator) => {
      onSuccess(migrator);
      queryClient.invalidateQueries({ queryKey: [MIGRATORS_QUERY_KEY] });
      queryClient.invalidateQueries({
        queryKey: [MIGRATOR_QUERY_KEY, migrator.id],
      });
    },
    onError: onError,
  });
};
