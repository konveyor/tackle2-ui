import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createStakeholder,
  deleteStakeholder,
  getStakeholders,
  updateStakeholder,
} from "@app/api/rest";
import { AxiosError } from "axios";
import { Role, Stakeholder, StakeholderWithRole } from "@app/api/models";
import { DEFAULT_REFETCH_INTERVAL } from "@app/Constants";
import { BusinessServicesQueryKey } from "./businessservices";
import { MigrationWavesQueryKey } from "./migration-waves";
import { assessmentsQueryKey } from "./assessments";
import { ARCHETYPES_QUERY_KEY } from "./archetypes";

export const StakeholdersQueryKey = "stakeholders";

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
    select: (stakeholders): StakeholderWithRole[] => {
      const stakeholdersWithRole = stakeholders.map((stakeholder) => {
        return { ...stakeholder, role: getRole(stakeholder) };
      });
      return stakeholdersWithRole;
    },
  });
  return {
    stakeholders: data || [],
    isFetching: isLoading,
    isSuccess,
    fetchError: error,
    refetch,
  };
};

export const useCreateStakeholderMutation = (
  onSuccess: (res: any) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createStakeholder,
    onSuccess: (res) => {
      onSuccess(res);
      queryClient.invalidateQueries({ queryKey: [StakeholdersQueryKey] });
    },
    onError,
  });
};

export const useUpdateStakeholderMutation = (
  onSuccess: (res: any) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateStakeholder,
    onSuccess: (res) => {
      onSuccess(res);
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
  onSuccess: (res: any) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteStakeholder,
    onSuccess: (res) => {
      onSuccess(res);
      queryClient.invalidateQueries({ queryKey: [StakeholdersQueryKey] });
      queryClient.invalidateQueries({ queryKey: [BusinessServicesQueryKey] });
      queryClient.invalidateQueries({ queryKey: [MigrationWavesQueryKey] });
      queryClient.invalidateQueries({ queryKey: [assessmentsQueryKey] });
      queryClient.invalidateQueries({ queryKey: [ARCHETYPES_QUERY_KEY] });
    },
    onError: onError,
  });
};
