import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useTranslation } from "react-i18next";

import { createRole, deleteRole, getRoles, updateRole } from "@app/api/rest";
import { useNotifications } from "@app/components/NotificationsContext";

import { Role } from "../types";

export const RolesQueryKey = "roles";

export const useFetchRoles = () => {
  const { data, isLoading, error } = useQuery<Role[], AxiosError>({
    queryKey: [RolesQueryKey],
    queryFn: getRoles,
  });
  return { roles: data ?? [], isFetching: isLoading, fetchError: error };
};

export const useCreateRoleMutation = (
  onSuccess?: () => void,
  onError?: () => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RolesQueryKey] });
      onSuccess?.();
    },
    onError: () => onError?.(),
  });
};

export const useUpdateRoleMutation = (
  onSuccess?: () => void,
  onError?: () => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RolesQueryKey] });
      onSuccess?.();
    },
    onError: () => onError?.(),
  });
};

export const useDeleteRoleMutation = (
  onSuccess?: () => void,
  onError?: () => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RolesQueryKey] });
      onSuccess?.();
    },
    onError: () => onError?.(),
  });
};

export const useRoleActionsWithNotifications = () => {
  const { t } = useTranslation();
  const { pushNotification } = useNotifications();

  const { mutate: deleteRole } = useDeleteRoleMutation(
    () =>
      pushNotification({
        title: t("titles.role"),
        message: t("message.roleDeleted"),
        variant: "info",
      }),
    () =>
      pushNotification({
        title: t("titles.role"),
        message: t("message.roleDeletionFailed"),
        variant: "danger",
      })
  );

  const { mutate: editRole } = useUpdateRoleMutation(
    () =>
      pushNotification({
        title: t("titles.role"),
        message: t("message.roleUpdated"),
        variant: "info",
      }),
    () =>
      pushNotification({
        title: t("titles.role"),
        message: t("message.roleUpdateFailed"),
        variant: "danger",
      })
  );

  const { mutate: createRole } = useCreateRoleMutation(
    () =>
      pushNotification({
        title: t("titles.role"),
        message: t("message.roleCreated"),
        variant: "info",
      }),
    () =>
      pushNotification({
        title: t("titles.role"),
        message: t("message.roleCreationFailed"),
        variant: "danger",
      })
  );

  return { deleteRole, editRole, createRole };
};
