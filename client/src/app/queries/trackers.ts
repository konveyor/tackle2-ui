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

export const TrackersQueryKey = "trackers";
export const TrackerProjectsQueryKey = "trackerProjects";
export const TrackerProjectIssuetypesQueryKey = "trackerProjectIssuetypes";

export const useFetchTrackers = () => {
  const queryClient = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [TrackersQueryKey],
    queryFn: getTrackers,
    onError: (error: AxiosError) => console.log("error, ", error),
    onSuccess: () => queryClient.invalidateQueries([TicketsQueryKey]),
    refetchInterval: 5000,
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

export const useFetchTrackerProjects = (trackerId?: number) => {
  const queryClient = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [TrackerProjectsQueryKey, { id: trackerId }],
    queryFn: () => getTrackerProjects(trackerId!),
    onError: (error: AxiosError) => console.log("error, ", error),
    onSuccess: () => queryClient.invalidateQueries([TicketsQueryKey]),
    enabled: !!trackerId,
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
  projectId?: string
) => {
  const queryClient = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [
      TrackerProjectIssuetypesQueryKey,
      { id: trackerId, projectId: projectId },
    ],
    queryFn: () => getTrackerProjectIssuetypes(trackerId!, projectId!),
    onError: (error: AxiosError) => console.log("error, ", error),
    onSuccess: () => queryClient.invalidateQueries([TicketsQueryKey]),
    enabled: !!trackerId && !!projectId,
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

export const useTrackerProjectsByTracker = (trackerName: string) => {
  const { trackers } = useFetchTrackers();
  const tracker = trackers.find((tracker) => tracker.name === trackerName);
  const { projects } = useFetchTrackerProjects(tracker?.id);
  return projects;
};

export const useTrackerTypesByProjectName = (
  trackerName: string,
  projectName: string
) => {
  const { trackers } = useFetchTrackers();
  const tracker = trackers.find((tracker) => tracker.name === trackerName);
  const { projects } = useFetchTrackerProjects(tracker?.id);
  const project = projects.find((project) => project.name === projectName);

  const { issuetypes } = useFetchTrackerProjectIssuetypes(
    tracker?.id,
    project?.id
  );
  return issuetypes;
};

export const useTrackerTypesByProjectId = (
  trackerName?: string,
  projectId?: string
) => {
  const { trackers } = useFetchTrackers();
  const tracker = trackers.find((tracker) => tracker.name === trackerName);
  const { projects } = useFetchTrackerProjects(tracker?.id);
  const project = projects.find((project) => project.id === projectId);

  const { issuetypes } = useFetchTrackerProjectIssuetypes(
    tracker?.id,
    project?.id
  );
  return issuetypes;
};
