import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import {
  getMigrationWaves,
  createMigrationWave,
  deleteMigrationWave,
  updateMigrationWave,
  deleteAllMigrationWaves,
} from "@app/api/rest";
import { getWavesWithStatus } from "@app/utils/waves-selector";
import { useDeleteTicketMutation, useFetchTickets } from "./tickets";
import { TrackersQueryKey } from "./trackers";
import { useFetchApplications } from "./applications";
import { useFetchStakeholders } from "./stakeholders";
import { MigrationWave, Ticket } from "@app/api/models";

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
  const { tickets } = useFetchTickets();
  const { mutateAsync: deleteTicket } = useDeleteTicketMutation();

  return useMutation({
    mutationFn: ({ wave }: { wave: MigrationWave }) =>
      deleteMigrationWave(wave).then((res) => {
        const deleteTicketPromiseList = wave.applications.map((app) => {
          const matchingTicket = tickets.find(
            (ticket) => ticket?.application?.name === app.name
          );
          const deleteTicketPromise =
            matchingTicket && deleteTicket({ ticket: matchingTicket });
          return deleteTicketPromise || [];
        });
        return Promise.all(deleteTicketPromiseList);
      }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries([MigrationWavesQueryKey]);
    },
    onError: (error) => {
      onError(error as AxiosError);
    },
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
