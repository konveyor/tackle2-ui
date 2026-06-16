import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { AuthMe, User } from "@app/api/models";
import {
  createUser,
  deleteUser,
  getAuthMe,
  getUsers,
  updateUser,
} from "@app/api/rest";

export const UsersQueryKey = "users";
export const CurrentUserQueryKey = [UsersQueryKey, "self"];

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

export const useFetchCurrentUserAndScopes = () => {
  const { data, isLoading, error } = useQuery<AuthMe, AxiosError>({
    queryKey: [...CurrentUserQueryKey],
    queryFn: getAuthMe,
  });

  return {
    userAndScopes: data,
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
      queryClient
        .invalidateQueries({ queryKey: [UsersQueryKey] })
        .then(() => onSuccess?.());
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
      queryClient
        .invalidateQueries({ queryKey: [UsersQueryKey] })
        .then(() => onSuccess?.());
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
      queryClient
        .invalidateQueries({ queryKey: [UsersQueryKey] })
        .then(() => onSuccess?.());
    },
    onError: () => {
      onError?.();
    },
  });
};
