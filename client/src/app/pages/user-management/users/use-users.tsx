import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useTranslation } from "react-i18next";

import { createUser, deleteUser, getUsers, updateUser } from "@app/api/rest";
import { useNotifications } from "@app/components/NotificationsContext";

import { User } from "../types";

export const UsersQueryKey = "users";

export const useFetchUsers = () => {
  const { data, isLoading, error } = useQuery<User[], AxiosError>({
    queryKey: [UsersQueryKey],
    queryFn: getUsers,
  });

  return {
    users: data ?? [],
    isLoading,
    fetchError: error,
  };
};

export const useDeleteUserMutation = (
  onSuccess?: () => void,
  onError?: () => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [UsersQueryKey] });
      onSuccess?.();
    },
    onError: () => {
      onError?.();
    },
  });
};

export const useUpdateUserMutation = (
  onSuccess?: () => void,
  onError?: () => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [UsersQueryKey] });
      onSuccess?.();
    },
    onError: () => {
      onError?.();
    },
  });
};

export const useCreateUserMutation = (
  onSuccess?: () => void,
  onError?: () => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [UsersQueryKey] });
      onSuccess?.();
    },
    onError: () => {
      onError?.();
    },
  });
};

export const useUserActionsWithNotifications = () => {
  const { t } = useTranslation();
  const { pushNotification } = useNotifications();

  const { mutate: deleteUser } = useDeleteUserMutation(
    () =>
      pushNotification({
        title: t("titles.user"),
        message: t("message.userDeleted"),
        variant: "info",
      }),
    () =>
      pushNotification({
        title: t("titles.user"),
        message: t("message.userDeletionFailed"),
        variant: "danger",
      })
  );
  const { mutate: editUser } = useUpdateUserMutation(
    () =>
      pushNotification({
        title: t("titles.user"),
        message: t("message.userUpdated"),
        variant: "info",
      }),
    () =>
      pushNotification({
        title: t("titles.user"),
        message: t("message.userUpdateFailed"),
        variant: "danger",
      })
  );
  const { mutate: createUser } = useCreateUserMutation(
    () =>
      pushNotification({
        title: t("titles.user"),
        message: t("message.userCreated"),
        variant: "info",
      }),
    () =>
      pushNotification({
        title: t("titles.user"),
        message: t("message.userCreationFailed"),
        variant: "danger",
      })
  );
  return { deleteUser, editUser, createUser };
};
