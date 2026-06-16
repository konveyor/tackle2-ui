import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { PersonalAccessToken, Token } from "@app/api/models";
import { createToken, deleteToken, getTokens } from "@app/api/rest";

export const TokensQueryKey = "tokens";

export const useFetchTokens = () => {
  const { data, isLoading, error } = useQuery<Token[], AxiosError>({
    queryKey: [TokensQueryKey],
    queryFn: getTokens,
  });
  return { tokens: data ?? [], isLoading, fetchError: error };
};

export const useDeleteTokenMutation = (
  onSuccess?: () => void,
  onError?: () => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteToken,
    onSuccess: () => {
      queryClient
        .invalidateQueries({ queryKey: [TokensQueryKey] })
        .then(() => onSuccess?.());
    },
    onError: () => onError?.(),
  });
};

export const useCreateTokenMutation = (
  onSuccess?: (pat: PersonalAccessToken) => void,
  onError?: () => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createToken,
    onSuccess: (pat) => {
      queryClient
        .invalidateQueries({ queryKey: [TokensQueryKey] })
        .then(() => onSuccess?.(pat));
    },
    onError: () => onError?.(),
  });
};
