import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import {
  getMigrationWaves,
  createMigrationWave,
  deleteMigrationWave,
  updateMigrationWave,
} from "@app/api/rest";

export const MigrationWavesQueryKey = "migration-waves";

export const useCreateMigrationWaveMutation = (
  onSuccess: (res: any) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createMigrationWave,
    onSuccess: (res) => {
      onSuccess(res);
      queryClient.invalidateQueries([MigrationWavesQueryKey]);
    },
    onError,
  });
};

export const useFetchMigrationWaves = () => {
  const { isLoading, error, refetch, data } = useQuery({
    queryKey: [MigrationWavesQueryKey],
    queryFn: getMigrationWaves,
    refetchInterval: 5000,
    onError: (error) => console.log("error, ", error),
  });
  return {
    migrationWaves: data || [],
    isFetching: isLoading,
    fetchError: error,
    refetch,
  };
};

export const useUpdateMigrationWaveMutation = (
  onSuccess: (res: any) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateMigrationWave,
    onSuccess: (res) => {
      onSuccess(res);
      queryClient.invalidateQueries([MigrationWavesQueryKey]);
    },
    onError: onError,
  });
};

export const useDeleteMigrationWaveMutation = (
  onSuccess: (migrationWaveName: string) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: number; name: string }) =>
      deleteMigrationWave(id),
    onSuccess: (_, vars) => {
      onSuccess(vars.name);
      queryClient.invalidateQueries([MigrationWavesQueryKey]);
    },
    onError,
  });
};
