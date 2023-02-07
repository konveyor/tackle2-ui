import { useMutation, useQuery, useQueryClient } from "react-query";
import { MigrationTarget } from "@app/api/models";
import { createMigrationTarget, updateMigrationTarget } from "@app/api/rest";
import { transformationTargets } from "@app/data/targets";

export const MigrationTargetsQueryKey = "rulesets";

export const useFetchMigrationTargets = () => {
  const { data, isLoading, error, refetch } = useQuery<MigrationTarget[]>(
    MigrationTargetsQueryKey,
    // TODO Replace once rulesets API supported by backend
    // async () => (await getMigrationTargets()).data,
    async () => [],
    {
      onError: (err) => console.log(err),
    }
  );
  return {
    // TODO Replace once rulesets API supported by backend
    // customTargets: data || [],
    migrationTargets: transformationTargets,
    isFetching: isLoading,
    fetchError: error,
    refetch,
  };
};

export const useUpdateMigrationTargetMutation = (
  onSuccess: (res: any) => void,
  onError: (err: Error | unknown) => void
) => {
  const queryClient = useQueryClient();
  const { isLoading, mutate, error } = useMutation(updateMigrationTarget, {
    onSuccess: (res) => {
      onSuccess(res);
      queryClient.invalidateQueries(MigrationTargetsQueryKey);
    },
    onError: (err) => {
      onError(err);
    },
  });
  return {
    mutate,
    isLoading,
    error,
  };
};

export const useCreateMigrationTargetMutation = (
  onSuccess: (res: any) => void,
  onError: (err: Error | unknown) => void
) => {
  const queryClient = useQueryClient();
  const { isLoading, mutate, error } = useMutation(createMigrationTarget, {
    onSuccess: (res) => {
      onSuccess(res);
      queryClient.invalidateQueries(MigrationTargetsQueryKey);
    },
    onError: (err) => {
      onError(err);
    },
  });
  return {
    mutate,
    isLoading,
    error,
  };
};
