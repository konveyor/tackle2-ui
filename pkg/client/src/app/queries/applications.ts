import { useState } from "react";
import { useMutation, useQuery } from "react-query";

import { Application } from "@app/api/models";
import { deleteApplication, getApplications } from "@app/api/rest";

export interface IFetchState {
  applications: Application[];
  isFetching: boolean;
  fetchError: any;
  refetch: () => void;
}

export const useFetchApplications = (
  defaultIsFetching: boolean = false
): IFetchState => {
  const [applications, setApplications] = useState<Application[]>([]);
  const { isLoading, error, refetch } = useQuery("applications", () =>
    getApplications()
      .then(({ data }) => {
        setApplications(data);
      })
      .catch((error) => {
        console.log("error, ", error);
      })
  );
  return {
    applications: applications,
    isFetching: isLoading,
    fetchError: error,
    refetch: refetch,
  };
};

export interface IMutateState {
  mutate: any;
  isLoading: boolean;
  error: any;
}

export const useDeleteApplicationMutation = (
  onSuccess: () => void,
  onError: (err: Error | null) => void
): IMutateState => {
  const { mutate, isLoading, error } = useMutation(deleteApplication, {
    onSuccess: () => {
      onSuccess && onSuccess();
    },
    onError: (err: Error) => {
      onError && onError(error);
    },
  });
  return { mutate, isLoading, error };
};
