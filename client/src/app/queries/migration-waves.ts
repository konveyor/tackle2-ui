import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { DEFAULT_REFETCH_INTERVAL } from "@app/Constants";
import { MigrationWave } from "@app/api/models";
import {
  createMigrationWave,
  deleteMigrationWave,
  deleteTicket,
  getMigrationWaves,
  updateMigrationWave,
} from "@app/api/rest";
import { getWavesWithStatus } from "@app/utils/waves-selector";

import { useFetchApplications } from "./applications";
import { useFetchStakeholders } from "./stakeholders";
import { TicketsQueryKey, useFetchTickets } from "./tickets";
import { TrackersQueryKey } from "./trackers";

export const MigrationWavesQueryKey = "migration-waves";

export const useCreateMigrationWaveMutation = (
  onSuccess: (newMigrationWave: MigrationWave) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createMigrationWave,
    onSuccess: (res) => {
      onSuccess(res);
      queryClient.invalidateQueries({ queryKey: [MigrationWavesQueryKey] });
    },
    onError,
  });
};

export const useFetchMigrationWaves = (
  refetchInterval: number | false = DEFAULT_REFETCH_INTERVAL
) => {
  const { tickets } = useFetchTickets();
  const { stakeholders } = useFetchStakeholders();
  const { data: applications } = useFetchApplications();

  const queryClient = useQueryClient();
  const { isLoading, error, refetch, data } = useQuery({
    queryKey: [MigrationWavesQueryKey],
    queryFn: getMigrationWaves,
    refetchInterval,
    onError: (error) => console.log("error, ", error),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [TrackersQueryKey] }),
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
  onSuccess: (migrationWave: MigrationWave) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateMigrationWave,
    onSuccess: (res, migrationWave) => {
      onSuccess(migrationWave);
      queryClient.invalidateQueries({ queryKey: [MigrationWavesQueryKey] });
    },
    onError: onError,
  });
};

export const useDeleteMigrationWaveMutation = (
  onSuccess: (migrationWave: MigrationWave) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (migrationWave: MigrationWave) =>
      deleteMigrationWave(migrationWave.id),
    onSuccess: (_, migrationWave) => {
      onSuccess(migrationWave);
      queryClient.invalidateQueries({ queryKey: [MigrationWavesQueryKey] });
    },
    onError,
  });
};

const deleteMultipleWithSingle = (toDelete: MigrationWave[]) => {
  return Promise.all(
    toDelete.map((migrationWave) => deleteMigrationWave(migrationWave.id))
  );
};

export const useDeleteAllMigrationWavesMutation = (
  onSuccess: (deleted: MigrationWave[]) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteMultipleWithSingle,
    onSuccess: (_, deleted) => {
      onSuccess(deleted);
      queryClient.invalidateQueries({ queryKey: [MigrationWavesQueryKey] });
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
      queryClient.invalidateQueries({ queryKey: [MigrationWavesQueryKey] });
      queryClient.invalidateQueries({ queryKey: [TicketsQueryKey] });
    },
    onError: onError,
  });
};
