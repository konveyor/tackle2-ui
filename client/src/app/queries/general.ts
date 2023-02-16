import { useState } from "react";
import { AxiosError } from "axios";
import { getGeneralQuery, updateGeneralQuery } from "@app/api/rest";
import { General } from "@app/api/models";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface IGeneralFetchState {
  general: General | undefined;
  isFetching: boolean;
  fetchError: Error | unknown;
}

export const GeneralQueryKey = "general";

export const useFetchGeneral = (): IGeneralFetchState => {
  const queryClient = useQueryClient();

  const { isLoading, data, error } = useQuery(
    [GeneralQueryKey],
    getGeneralQuery,
    {
      onSuccess: (data: General) => {
        queryClient.invalidateQueries([GeneralQueryKey]);
      },
      onError: (error: AxiosError) => console.log(error),
    }
  );
  return {
    general: data,
    isFetching: isLoading,
    fetchError: error,
  };
};

export const useUpdateGeneralMutation = (
  onSuccess: (res: any) => void,
  onError: (err: Error | unknown) => void
) => {
  const queryClient = useQueryClient();

  return useMutation(updateGeneralQuery, {
    onSuccess: (data) => {
      onSuccess(data);
      queryClient.invalidateQueries([GeneralQueryKey]);
    },
    onError: (err) => {
      onError(err);
      queryClient.invalidateQueries([GeneralQueryKey]);
    },
  });
};
