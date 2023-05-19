import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import {
  createTracker,
  deleteTracker,
  getTrackers,
  updateTracker,
} from "@app/api/rest";
import { Tracker } from "@app/api/models";

export const TrackersQueryKey = "trackers";

export const useFetchTrackers = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [TrackersQueryKey],
    queryFn: getTrackers,
    onError: (error: AxiosError) => console.log("error, ", error),
  });
  return {
    trackers: data || [],
    isFetching: isLoading,
    fetchError: error,
    refetch,
  };
};

export const useCreateTrackerMutation = (
  onSuccess: (res: any) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTracker,
    onSuccess: () => {
      onSuccess;
      queryClient.invalidateQueries([TrackersQueryKey]);
    },
    onError: onError,
  });
};

export const useUpdateTrackerMutation = (
  onSuccess: (res: any) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateTracker,
    onSuccess: (res) => {
      onSuccess(res);
      queryClient.invalidateQueries([TrackersQueryKey]);
    },
    onError: onError,
  });
};

export const useDeleteTrackerMutation = (
  onSuccess: (instanceName: string) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: number; name: string }) => deleteTracker(id),
    onSuccess: (_, vars) => {
      onSuccess(vars.name);
      queryClient.invalidateQueries([TrackersQueryKey]);
    },
    onError: onError,
  });
};

export const getTrackersByKind = (instances: Tracker[], kind: string) =>
  instances.filter((instance) => instance.kind === kind && instance.connected);

export const getTrackerProjectsByInstance = (
  instances: Tracker[],
  instanceName: string
) =>
  instances
    .filter((instance) => instance.name === instanceName)
    .map((instance) => instance.metadata?.projects.map((project) => project))
    .flat();

export const getTrackerTypesByProjectName = (
  instances: Tracker[],
  instanceName: string,
  projectName: string
) =>
  getTrackerProjectsByInstance(instances, instanceName)
    .filter((project) => project.name === projectName)
    .map((project) => project.issueTypes)
    .flat();

export const getTrackerTypesByProjectId = (
  instances: Tracker[],
  instanceName: string,
  projectId: string
) =>
  getTrackerProjectsByInstance(instances, instanceName)
    .filter((project) => project.id === projectId)
    .map((project) => project.issueTypes)
    .flat();
