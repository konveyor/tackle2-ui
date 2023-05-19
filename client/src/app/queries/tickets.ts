import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createTicket, deleteTicket, getTickets } from "@app/api/rest";
import { AxiosError } from "axios";
import { Ticket } from "@app/api/models";
import React from "react";

export const TicketsQueryKey = "tickets";

export const useCreateTicketMutation = (
  onSuccess: (res: any) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTicket,
    onSuccess: onSuccess,
    onError: onError,
  });
};

export const useFetchTickets = () => {
  const { isLoading, error, refetch, data } = useQuery({
    queryKey: [TicketsQueryKey],
    queryFn: getTickets,
    refetchInterval: 5000,
    onError: (error) => console.log("error, ", error),
  });
  return {
    tickets: data || [],
    isFetching: isLoading,
    fetchError: error,
    refetch,
  };
};
