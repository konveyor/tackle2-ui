import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import {
  createTracker,
  deleteTracker,
  getTrackerProjectIssuetypes,
  getTrackerProjects,
  getTrackers,
  updateTracker,
} from "@app/api/rest";
import { Tracker } from "@app/api/models";
import { TicketsQueryKey } from "./tickets";
import { DEFAULT_REFETCH_INTERVAL } from "@app/Constants";

export const TrackersQueryKey = "trackers";
export const TrackerProjectsQueryKey = "trackerProjects";
export const TrackerProjectIssuetypesQueryKey = "trackerProjectIssuetypes";

export const useFetchTrackers = (
  refetchInterval: number | false = DEFAULT_REFETCH_INTERVAL
) => {
  const queryClient = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [TrackersQueryKey],
    queryFn: getTrackers,
    onError: (error: AxiosError) => console.log("error, ", error),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [TicketsQueryKey] }),
    refetchInterval,
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
    onSuccess: (res) => {
      onSuccess(res);
      queryClient.invalidateQueries({ queryKey: [TrackersQueryKey] });
    },
    onError: onError,
  });
};

export const useUpdateTrackerMutation = (
  onSuccess: (res: any, tracker: Tracker) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateTracker,
    onSuccess: (res, tracker) => {
      onSuccess(res, tracker);
      queryClient.invalidateQueries({ queryKey: [TrackersQueryKey] });
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
      queryClient.invalidateQueries({ queryKey: [TrackersQueryKey] });
    },
    onError: onError,
  });
};

export const useFetchTrackerProjects = (
  trackerId?: number,
  refetchInterval: number | false = DEFAULT_REFETCH_INTERVAL
) => {
  const queryClient = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [TrackerProjectsQueryKey, { id: trackerId }],
    queryFn: () => getTrackerProjects(trackerId!),
    onError: (error: AxiosError) => console.log("error, ", error),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [TicketsQueryKey] }),
    enabled: !!trackerId,
    refetchInterval,
  });
  return {
    projects: data || [],
    isFetching: isLoading,
    fetchError: error,
    refetch,
  };
};

export const useFetchTrackerProjectIssuetypes = (
  trackerId?: number,
  projectId?: string,
  refetchInterval: number | false = DEFAULT_REFETCH_INTERVAL
) => {
  const queryClient = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [
      TrackerProjectIssuetypesQueryKey,
      { id: trackerId, projectId: projectId },
    ],
    queryFn: () => getTrackerProjectIssuetypes(trackerId!, projectId!),
    onError: (error: AxiosError) => console.log("error, ", error),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [TicketsQueryKey] }),
    enabled: !!trackerId && !!projectId,
    refetchInterval,
  });
  return {
    issuetypes: data || [],
    isFetching: isLoading,
    fetchError: error,
    refetch,
  };
};

export const getTrackersByKind = (trackers: Tracker[], kind: string) =>
  trackers.filter((tracker) => tracker.kind === kind && tracker.connected);

export const useTrackerProjectsByTracker = (
  trackerName: string,
  refetchInterval: number | false = DEFAULT_REFETCH_INTERVAL
) => {
  const { trackers } = useFetchTrackers(refetchInterval);
  const tracker = trackers.find((tracker) => tracker.name === trackerName);

  const { projects } = useFetchTrackerProjects(tracker?.id, refetchInterval);
  return projects;
};

export const useTrackerTypesByProjectName = (
  trackerName: string,
  projectName: string,
  refetchInterval: number | false = DEFAULT_REFETCH_INTERVAL
) => {
  const { trackers } = useFetchTrackers(refetchInterval);
  const tracker = trackers.find((tracker) => tracker.name === trackerName);

  const { projects } = useFetchTrackerProjects(tracker?.id, refetchInterval);
  const project = projects.find((project) => project.name === projectName);

  const { issuetypes } = useFetchTrackerProjectIssuetypes(
    tracker?.id,
    project?.id,
    refetchInterval
  );
  return issuetypes;
};

export const useTrackerTypesByProjectId = (
  trackerName?: string,
  projectId?: string,
  refetchInterval: number | false = DEFAULT_REFETCH_INTERVAL
) => {
  const { trackers } = useFetchTrackers(refetchInterval);
  const tracker = trackers.find((tracker) => tracker.name === trackerName);

  const { projects } = useFetchTrackerProjects(tracker?.id, refetchInterval);
  const project = projects.find((project) => project.id === projectId);

  const { issuetypes } = useFetchTrackerProjectIssuetypes(
    tracker?.id,
    project?.id,
    refetchInterval
  );
  return issuetypes;
};
