import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createTicket } from "@app/api/rest";
import { AxiosError } from "axios";

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
