import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import {
  getMigrationWaves,
  createMigrationWave,
  deleteMigrationWave,
  updateMigrationWave,
  deleteAllMigrationWaves,
  deleteTicket,
} from "@app/api/rest";
import { getWavesWithStatus } from "@app/utils/waves-selector";
import { useFetchTickets } from "./tickets";
import { TrackersQueryKey } from "./trackers";
import { useFetchApplications } from "./applications";
import { useFetchStakeholders } from "./stakeholders";

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
  const { tickets } = useFetchTickets();
  const { stakeholders } = useFetchStakeholders();
  const { data: applications } = useFetchApplications();

  const queryClient = useQueryClient();
  const { isLoading, error, refetch, data } = useQuery({
    queryKey: [MigrationWavesQueryKey],
    queryFn: getMigrationWaves,
    refetchInterval: 5000,
    onError: (error) => console.log("error, ", error),
    onSuccess: () => queryClient.invalidateQueries([TrackersQueryKey]),
    select: (waves) =>
      getWavesWithStatus(waves, tickets, stakeholders, applications),
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

export const useDeleteAllMigrationWavesMutation = (
  onSuccess: (res: any) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAllMigrationWaves,
    onSuccess: (res) => {
      onSuccess(res);
      queryClient.invalidateQueries([MigrationWavesQueryKey]);
    },
    onError: onError,
  });
};
export const useDeleteTicketMutation = (
  onSuccess?: (res: any) => void,
  onError?: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTicket,
    onSuccess: (res) => {
      onSuccess && onSuccess(res);
      queryClient.invalidateQueries([MigrationWavesQueryKey]);
    },
    onError: onError,
  });
};
