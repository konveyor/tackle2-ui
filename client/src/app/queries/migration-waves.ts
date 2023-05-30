import {
  useMutation,
  useQuery,
  useQueryClient,
  QueryCache,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import {
  getMigrationWaves,
  createMigrationWave,
  deleteMigrationWave,
  updateMigrationWave,
  deleteAllMigrationWaves,
} from "@app/api/rest";
import {
  WaveWithStatus,
  MigrationWave,
  Ticket,
  TicketStatus,
  AggregateTicketStatus,
  Application,
} from "@app/api/models";
import { TicketsQueryKey, useFetchTickets } from "./tickets";
import dayjs from "dayjs";
import { ApplicationsQueryKey } from "./applications";

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
    select: (waves): WaveWithStatus[] => {
      const aggregateTicketStatus = (val: TicketStatus, startDate: string) => {
        const ticketStatusToAggregate: Map<
          TicketStatus,
          AggregateTicketStatus
        > = new Map([
          ["", "Creating Issues"],
          ["New", "Issues Created"],
          ["In Progress", "In Progress"],
          ["Done", "Completed"],
          ["Error", "Error"],
        ]);

        const status = ticketStatusToAggregate.get(val);
        if (status === "Issues Created") {
          const now = dayjs.utc();
          const start = dayjs.utc(startDate);
          var duration = now.diff(start);
          if (duration > 0) return "In Progress";
        }
        return status ? status : "Error";
      };

      const aggregatedTicketStatus = (
        wave: MigrationWave,
        tickets: Ticket[]
      ): AggregateTicketStatus => {
        const statuses = getTicketStatus(wave, tickets);
        if (statuses.length === 0) return "No Issues";

        const status = statuses.reduce(
          (acc, val) => (acc === val ? acc : "Error"),
          statuses[0]
        );

        return aggregateTicketStatus(status, wave.startDate);
      };
      const getTicketByApplication = (tickets: Ticket[], id: number = 0) =>
        tickets.find((ticket) => ticket.application?.id === id);

      const getTicketStatus = (
        wave: MigrationWave,
        tickets: Ticket[]
      ): TicketStatus[] =>
        wave.applications.map(
          (application): TicketStatus =>
            getTicketByApplication(tickets, application.id)?.status || ""
        );

      const wavesWithStatus: WaveWithStatus[] = waves.map(
        (wave): WaveWithStatus => {
          const queryClient = useQueryClient();
          const tickets = queryClient.getQueryData([
            TicketsQueryKey,
          ]) as Ticket[];
          const applications = queryClient.getQueryData([
            ApplicationsQueryKey,
          ]) as Application[];
          return {
            ...wave,
            ticketStatus: getTicketStatus(wave, tickets),
            status: aggregatedTicketStatus(wave, tickets),
            fullApplications: applications,
          };
        }
      );
      return wavesWithStatus;
    },
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
