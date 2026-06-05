import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { DEFAULT_REFETCH_INTERVAL } from "@app/Constants";
import { New, Role, Stakeholder, StakeholderWithRole } from "@app/api/models";
import {
  createStakeholder,
  deleteStakeholder,
  getStakeholders,
  updateStakeholder,
} from "@app/api/rest";

import { ARCHETYPES_QUERY_KEY } from "./archetypes";
import { assessmentsQueryKey } from "./assessments";
import { BusinessServicesQueryKey } from "./businessservices";
import { MigrationWavesQueryKey } from "./migration-waves";

const StakeholdersQueryKey = "stakeholders";

const getRole = (stakeholder: Stakeholder): Role => {
  if (stakeholder.owns && stakeholder.owns.length > 0) {
    return "Owner";
  }

  if (stakeholder.contributes && stakeholder.contributes.length > 0) {
    return "Contributor";
  }

  return null;
};

export const useFetchStakeholders = (
  refetchInterval: number | false = DEFAULT_REFETCH_INTERVAL
) => {
  const { data, isLoading, isSuccess, error, refetch } = useQuery({
    queryKey: [StakeholdersQueryKey],
    queryFn: getStakeholders,
    onError: (error: AxiosError) => console.log("error, ", error),
    refetchInterval,
    select: (stakeholders): StakeholderWithRole[] =>
      stakeholders.map((stakeholder) => ({
        ...stakeholder,
        role: getRole(stakeholder),
      })),
  });
  return {
    stakeholders: data || [],
    isFetching: isLoading,
    isLoading,
    isSuccess,
    fetchError: error,
    refetch,
  };
};

export const useCreateStakeholderMutation = (
  onSuccess: () => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (obj: New<Stakeholder>) => createStakeholder(obj),
    onSuccess: () => {
      onSuccess();
      queryClient.invalidateQueries({ queryKey: [StakeholdersQueryKey] });
    },
    onError,
  });
};

export const useUpdateStakeholderMutation = (
  onSuccess: () => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateStakeholder,
    onSuccess: () => {
      onSuccess();
      queryClient.invalidateQueries({ queryKey: [StakeholdersQueryKey] });
      queryClient.invalidateQueries({ queryKey: [BusinessServicesQueryKey] });
      queryClient.invalidateQueries({ queryKey: [MigrationWavesQueryKey] });
      queryClient.invalidateQueries({ queryKey: [assessmentsQueryKey] });
      queryClient.invalidateQueries({ queryKey: [ARCHETYPES_QUERY_KEY] });
    },
    onError: onError,
  });
};

export const useDeleteStakeholderMutation = (
  onSuccess: () => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteStakeholder,
    onSuccess: () => {
      onSuccess();
      queryClient.invalidateQueries({ queryKey: [StakeholdersQueryKey] });
      queryClient.invalidateQueries({ queryKey: [BusinessServicesQueryKey] });
      queryClient.invalidateQueries({ queryKey: [MigrationWavesQueryKey] });
      queryClient.invalidateQueries({ queryKey: [assessmentsQueryKey] });
      queryClient.invalidateQueries({ queryKey: [ARCHETYPES_QUERY_KEY] });
    },
    onError: onError,
  });
};
