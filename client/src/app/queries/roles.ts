import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { UserRole as Role } from "@app/api/models";
import { createRole, deleteRole, getRoles, updateRole } from "@app/api/rest";

export const RolesQueryKey = "roles";

export const useFetchRoles = () => {
  const { data, isLoading, error } = useQuery<Role[], AxiosError>({
    queryKey: [RolesQueryKey],
    queryFn: getRoles,
  });
  return { roles: data ?? [], isLoading, fetchError: error };
};

export const useCreateRoleMutation = (
  onSuccess?: () => void,
  onError?: () => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRole,
    onSuccess: () => {
      queryClient
        .invalidateQueries({ queryKey: [RolesQueryKey] })
        .then(() => onSuccess?.());
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
      queryClient
        .invalidateQueries({ queryKey: [RolesQueryKey] })
        .then(() => onSuccess?.());
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
      queryClient
        .invalidateQueries({ queryKey: [RolesQueryKey] })
        .then(() => onSuccess?.());
      onSuccess?.();
    },
    onError: () => onError?.(),
  });
};
