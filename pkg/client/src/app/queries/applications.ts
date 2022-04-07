import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";

import { Application } from "@app/api/models";
import {
  deleteApplication,
  getApplicationsQuery,
  updateApplication,
} from "@app/api/rest";

export const useFetchApplications = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const { isLoading, error, refetch } = useQuery(
    "applications",
    getApplicationsQuery,
    {
      // TODO Remove refetchInterval once applications mutations are handled via queries
      // with invalidateQueries and setQueryData
      refetchInterval: 5000,
      onSuccess: (data: Application[]) => setApplications(data),
      onError: (err: Error) => {
        console.log(error);
      },
    }
  );
  return {
    applications,
    isFetching: isLoading,
    fetchError: error,
    refetch,
  };
};

export const useApplicationMutation = () => {
  const queryClient = useQueryClient();
  queryClient.getQueryData("applications");

  return useMutation(updateApplication, {
    onMutate: async (newApplication) => {
      const previousApplications = queryClient.getQueryData("applications");
      queryClient.setQueryData<Application>(
        "applications",
        (old: Application[]) => [...old, newApplication]
      );
      return { previousApplications };
    },
    onError: (err, newApplication, context: any) => {
      queryClient.setQueryData("applications", context.previousApplications);
    },
    onSettled: () => {
      queryClient.invalidateQueries("applications");
    },
  });
};

export const useDeleteApplicationMutation = (
  onSuccess: () => void,
  onError: (err: Error | null) => void
) => {
  return useMutation(deleteApplication, {
    onSuccess: () => {
      onSuccess && onSuccess();
    },
    onError: (err: Error) => {
      onError && onError(err);
    },
  });
};
