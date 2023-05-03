import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MigrationWave } from "@app/api/models";
import { AxiosError } from "axios";
import {
  getMigrationWaves,
  createMigrationWave,
  deleteMigrationWave,
} from "@app/api/rest";

export const MigrationWavesQueryKey = "migrationwaves";

export const useCreateMigrationWaveMutation = (
  onSuccess: (res: any) => void,
  onError: (err: Error | unknown) => void
) => {
  const queryClient = useQueryClient();

  return useMutation(createMigrationWave, {
    onSuccess: (res) => {
      onSuccess(res);
      queryClient.invalidateQueries([MigrationWavesQueryKey]);
    },
    onError,
  });
};

export const useFetchMigrationWaves = () => {
  const { isLoading, error, refetch, data } = useQuery<MigrationWave[]>(
    [MigrationWavesQueryKey],
    getMigrationWaves,
    {
      refetchInterval: 5000,
      onError: (error) => console.log("error, ", error),
    }
  );
  return {
    waves: data || [],
    isFetching: isLoading,
    fetchError: error,
    refetch,
  };
};

export const useDeleteMigrationWaveMutation = (
  onSuccess: (res: any) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  const { isLoading, mutate, error } = useMutation(deleteMigrationWave, {
    onSuccess: (res) => {
      onSuccess(res);
      queryClient.invalidateQueries([MigrationWavesQueryKey]);
    },
    onError: (err: AxiosError) => {
      onError(err);
    },
  });
  return {
    mutate,
    isLoading,
    error,
  };
};
