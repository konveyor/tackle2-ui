import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { DEFAULT_REFETCH_INTERVAL } from "@app/Constants";
import { HubFile, New, Target } from "@app/api/models";
import {
  createFile,
  createTarget,
  deleteTarget,
  getTargets,
  updateTarget,
} from "@app/api/rest";

import { useSetting } from "./settings";

const TargetsQueryKey = "targets";

export const useFetchTargets = (
  refetchInterval: number | false = DEFAULT_REFETCH_INTERVAL
) => {
  const {
    data: targets,
    isLoading,
    isSuccess,
    error,
    refetch,
  } = useQuery<Target[]>({
    queryKey: [TargetsQueryKey],
    queryFn: getTargets,
    onError: (err) => console.log(err),
    refetchInterval,
  });

  const { data: targetOrder = [] } = useSetting("ui.target.order");

  const targetsInOrder = useMemo(
    () =>
      !targets
        ? []
        : targets
            .map((target, targetIndex) => {
              const index = targetOrder.findIndex((id) => id === target.id);
              return {
                target,
                order: index === -1 ? targets.length + targetIndex : index,
              };
            })
            .sort((a, b) => a.order - b.order)
            .map(({ target }) => target),
    [targets, targetOrder]
  );

  return {
    /** Targets in their original order */
    targets: targets || [],
    /**
     * Targets in the order specified by the setting "ui.target.order" including targets
     * that are not in the setting at the end of the list.
     */
    targetsInOrder,
    isFetching: isLoading,
    isSuccess,
    fetchError: error,
    refetch,
  };
};

export const useUpdateTargetMutation = (
  onSuccess: (target: Target) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  const { isPending, mutate, error } = useMutation({
    mutationFn: updateTarget,
    onSuccess: (_, target) => {
      onSuccess(target);
      queryClient.invalidateQueries({ queryKey: [TargetsQueryKey] });
    },
    onError: (err: AxiosError) => {
      onError(err);
    },
  });
  return {
    mutate,
    isPending,
    error,
  };
};

export const useDeleteTargetMutation = (
  onSuccess: (id: number) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  const { isPending, mutate, error } = useMutation({
    mutationFn: deleteTarget,
    onSuccess: (_, id) => {
      onSuccess(id);
      queryClient.invalidateQueries({ queryKey: [TargetsQueryKey] });
    },
    onError: (err: AxiosError) => {
      onError(err);
      queryClient.invalidateQueries({ queryKey: [TargetsQueryKey] });
    },
  });
  return {
    mutate,
    isPending,
    error,
  };
};

export const useCreateTargetMutation = (
  onSuccess: (target: Target) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  const { isPending, mutate, mutateAsync, error } = useMutation({
    mutationFn: (obj: New<Target>) => createTarget(obj),
    onSuccess: (target) => {
      onSuccess(target);
      queryClient.invalidateQueries({ queryKey: [TargetsQueryKey] });
    },
    onError: (err: AxiosError) => {
      onError(err);
    },
  });
  return {
    mutate,
    mutateAsync,
    isPending,
    error,
  };
};

export const useCreateFileMutation = (
  onSuccess?: (data: HubFile, file: File) => void,
  onError?: (err: AxiosError, file: File) => void
) => {
  const queryClient = useQueryClient();
  const { isPending, mutate, mutateAsync, error } = useMutation({
    mutationFn: createFile,
    onSuccess: (data, { file }) => {
      onSuccess?.(data, file);
      queryClient.invalidateQueries({ queryKey: [TargetsQueryKey] });
    },
    onError: (err: AxiosError, { file }) => {
      onError?.(err, file);
    },
  });
  return {
    mutate,
    mutateAsync,
    isPending,
    error,
  };
};

// TODO: Add `useRemoveFileMutation` with id, name, path as the required rest fields
