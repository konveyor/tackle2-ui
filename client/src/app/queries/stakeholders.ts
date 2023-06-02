import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createStakeholder,
  deleteStakeholder,
  getStakeholders,
  updateStakeholder,
} from "@app/api/rest";
import { AxiosError } from "axios";
import { Role, Stakeholder, StakeholderWithRole } from "@app/api/models";

export const StakeholdersQueryKey = "stakeholders";

export const useFetchStakeholders = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [StakeholdersQueryKey],
    queryFn: getStakeholders,
    onError: (error: AxiosError) => console.log("error, ", error),
    select: (stakeholders): StakeholderWithRole[] => {
      const getRole = (stakeholder: Stakeholder): Role => {
        if (stakeholder.owns && stakeholder.owns.length > 0) return "Owner";
        if (stakeholder.contributes && stakeholder.contributes.length > 0)
          return "Contributor";
        return null;
      };
      const stakeholdersWithRole = stakeholders.map((stakeholder) => {
        return { ...stakeholder, role: getRole(stakeholder) };
      });
      return stakeholdersWithRole;
    },
  });
  return {
    stakeholders: data || [],
    isFetching: isLoading,
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
      queryClient.invalidateQueries([StakeholdersQueryKey]);
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
      queryClient.invalidateQueries([StakeholdersQueryKey]);
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
      queryClient.invalidateQueries([StakeholdersQueryKey]);
    },
    onError: onError,
  });
};
