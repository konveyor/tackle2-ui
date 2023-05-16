import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import {
  createJiraTracker,
  deleteJiraTracker,
  getJiraTrackers,
  updateJiraTracker,
} from "@app/api/rest";
import { JiraTracker } from "@app/api/models";

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
    onSuccess: () => {
      onSuccess;
      queryClient.invalidateQueries([JiraTrackersQueryKey]);
    },
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
    onSuccess: (res) => {
      onSuccess(res);
      queryClient.invalidateQueries([JiraTrackersQueryKey]);
    },
    onError: onError,
  });
};

export const useDeleteJiraTrackerMutation = (
  onSuccess: (instanceName: string) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: number; name: string }) => deleteJiraTracker(id),
    onSuccess: (_, vars) => {
      onSuccess(vars.name);
      queryClient.invalidateQueries([JiraTrackersQueryKey]);
    },
    onError: onError,
  });
};

export const getInstancesByKind = (instances: JiraTracker[], kind: string) =>
  instances.filter((instance) => instance.kind === kind && instance.connected);

export const getProjectsByInstance = (
  instances: JiraTracker[],
  instanceName: string
) =>
  instances
    .filter((instance) => instance.name === instanceName)
    .map((instance) => instance.metadata?.projects.map((project) => project))
    .flat();

export const getTypesByProjectName = (
  instances: JiraTracker[],
  instanceName: string,
  projectName: string
) =>
  getProjectsByInstance(instances, instanceName)
    .filter((project) => project.name === projectName)
    .map((project) => project.issueTypes)
    .flat();

export const getTypesByProjectId = (
  instances: JiraTracker[],
  instanceName: string,
  projectId: string
) =>
  getProjectsByInstance(instances, instanceName)
    .filter((project) => project.id === projectId)
    .map((project) => project.issueTypes)
    .flat();
