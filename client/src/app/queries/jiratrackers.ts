import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { JiraTracker } from "@app/api/models";
import { AxiosError, AxiosResponse } from "axios";

import {
  createJiraTracker,
  deleteJiraTracker,
  getJiraTrackers,
  updateJiraTracker,
} from "@app/api/rest";

export const JiraTrackersQueryKey = "jiratrackers";

export const useFetchJiraTrackers = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [JiraTrackersQueryKey],
    queryFn: getJiraTrackers,
    onError: (error: AxiosError) => console.log("error, ", error),
  });
  return {
    jiraTrackers: data || [],
    isFetching: isLoading,
    fetchError: error,
    refetch,
  };
};

export const useCreateJiraTrackerMutation = (
  onSuccess: (res: any) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createJiraTracker,
    onSuccess: onSuccess,
    onError: onError,
  });
};

export const useUpdateJiraTrackerMutation = (
  onSuccess: (res: any) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateJiraTracker,
    onSuccess: onSuccess,
    onError: onError,
  });
};

export const useDeleteJiraTrackerMutation = (
  onSuccess: (instanceName: string) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: number }) => deleteJiraTracker(id),
    onSuccess: (res) => {
      onSuccess(res.name);
      queryClient.invalidateQueries([JiraTrackersQueryKey]);
    },
    onError: onError,
  });
};
