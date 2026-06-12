import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useTranslation } from "react-i18next";

import { createToken, deleteToken, getTokens } from "@app/api/rest";
import { useNotifications } from "@app/components/NotificationsContext";

import { PersonalAccessToken, Token } from "../types";

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
      queryClient.invalidateQueries({ queryKey: [TokensQueryKey] });
      onSuccess?.();
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
      queryClient.invalidateQueries({ queryKey: [TokensQueryKey] });
      onSuccess?.(pat);
    },
    onError: () => onError?.(),
  });
};

export const useTokenActionsWithNotifications = () => {
  const { t } = useTranslation();
  const { pushNotification } = useNotifications();

  const { mutate: deleteToken } = useDeleteTokenMutation(
    () =>
      pushNotification({
        title: t("titles.token"),
        message: t("message.tokenDeleted"),
        variant: "info",
      }),
    () =>
      pushNotification({
        title: t("titles.token"),
        message: t("message.tokenDeletionFailed"),
        variant: "danger",
      })
  );

  return { deleteToken };
};
