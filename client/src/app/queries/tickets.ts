import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createTickets, getTickets } from "@app/api/rest";
import { AxiosError } from "axios";
import { New, Ref, Ticket } from "@app/api/models";
import { DEFAULT_REFETCH_INTERVAL } from "@app/Constants";

export const TicketsQueryKey = "tickets";

export const useCreateTicketsMutation = (
  onSuccess: () => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      payload,
      applications,
    }: {
      payload: New<Ticket>;
      applications: Ref[];
    }) => createTickets(payload, applications),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TicketsQueryKey] });
      onSuccess();
    },
    onError: onError,
  });
};

export const useFetchTickets = (
  refetchInterval: number | false = DEFAULT_REFETCH_INTERVAL
) => {
  const { isLoading, error, refetch, data } = useQuery({
    queryKey: [TicketsQueryKey],
    queryFn: getTickets,
    refetchInterval,
    onError: (error) => console.log("error, ", error),
  });
  return {
    tickets: data || [],
    isFetching: isLoading,
    fetchError: error,
    refetch,
  };
};
