import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { getUsers } from "@app/api/rest";

import { User } from "./types";

export const UsersQueryKey = "users";

export const useFetchUsers = () => {
  const { data, isLoading, error } = useQuery<User[], AxiosError>({
    queryKey: [UsersQueryKey],
    queryFn: getUsers,
  });

  return {
    users: data ?? [],
    isFetching: isLoading,
    fetchError: error,
  };
};
