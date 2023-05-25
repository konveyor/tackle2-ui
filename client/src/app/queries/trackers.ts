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
    refetchInterval: 5000,
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
  onSuccess: (trackerName: string) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tracker }: { tracker: Tracker }) =>
      deleteTracker(tracker.id),
    onSuccess: (_, vars) => {
      onSuccess(vars.tracker.name);
      queryClient.invalidateQueries([TrackersQueryKey]);
    },
    onError: onError,
  });
};

export const getTrackersByKind = (trackers: Tracker[], kind: string) =>
  trackers.filter((tracker) => tracker.kind === kind && tracker.connected);

export const getTrackerProjectsByTracker = (
  trackers: Tracker[],
  trackerName: string
) =>
  trackers
    .filter((tracker) => tracker.name === trackerName)
    .map((tracker) => tracker.metadata?.projects.map((project) => project))
    .flat();

export const getTrackerTypesByProjectName = (
  trackers: Tracker[],
  trackerName: string,
  projectName: string
) =>
  getTrackerProjectsByTracker(trackers, trackerName)
    .filter((project) => project.name === projectName)
    .map((project) => project.issueTypes)
    .flat();

export const getTrackerTypesByProjectId = (
  trackers: Tracker[],
  trackerName: string,
  projectId: string
) =>
  getTrackerProjectsByTracker(trackers, trackerName)
    .filter((project) => project.id === projectId)
    .map((project) => project.issueTypes)
    .flat();
