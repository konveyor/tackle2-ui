import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useTranslation } from "react-i18next";

import {
  createPermission,
  deletePermission,
  getPermissions,
} from "@app/api/rest";
import { useNotifications } from "@app/components/NotificationsContext";

import { Permission } from "../types";

export const PermissionsQueryKey = "permissions";

export const useFetchPermissions = () => {
  const { data, isLoading, error } = useQuery<Permission[], AxiosError>({
    queryKey: [PermissionsQueryKey],
    queryFn: getPermissions,
  });
  return { permissions: data ?? [], isFetching: isLoading, fetchError: error };
};

export const useCreatePermissionMutation = (
  onSuccess?: () => void,
  onError?: () => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPermission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PermissionsQueryKey] });
      onSuccess?.();
    },
    onError: () => onError?.(),
  });
};

export const useDeletePermissionMutation = (
  onSuccess?: () => void,
  onError?: () => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePermission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PermissionsQueryKey] });
      onSuccess?.();
    },
    onError: () => onError?.(),
  });
};

export const usePermissionActionsWithNotifications = () => {
  const { t } = useTranslation();
  const { pushNotification } = useNotifications();

  const { mutate: deletePermission } = useDeletePermissionMutation(
    () =>
      pushNotification({
        title: t("titles.permission"),
        message: t("message.permissionDeleted"),
        variant: "info",
      }),
    () =>
      pushNotification({
        title: t("titles.permission"),
        message: t("message.permissionDeletionFailed"),
        variant: "danger",
      })
  );

  const { mutate: createPermission } = useCreatePermissionMutation(
    () =>
      pushNotification({
        title: t("titles.permission"),
        message: t("message.permissionCreated"),
        variant: "info",
      }),
    () =>
      pushNotification({
        title: t("titles.permission"),
        message: t("message.permissionCreationFailed"),
        variant: "danger",
      })
  );

  return { deletePermission, createPermission };
};
