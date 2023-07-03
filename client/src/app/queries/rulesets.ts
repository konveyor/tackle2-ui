import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { IReadFile, Metadata, Ruleset } from "@app/api/models";
import {
  createFile,
  createRuleset,
  deleteRuleset,
  getRulesets,
  updateRuleset,
} from "@app/api/rest";
import { AxiosError } from "axios";
import { getLabels } from "@app/common/CustomRules/rules-utils";

export const RulesetsQueryKey = "rulesets";

export const useFetchRulesets = () => {
  const { data, isLoading, error, refetch } = useQuery<Ruleset[]>(
    [RulesetsQueryKey],
    async () => await getRulesets(),
    {
      onError: (err) => console.log(err),
      select: (data) => {
        return data.map((ruleset) => {
          const mappedRules = ruleset.rules.map((rule) => {
            if (ruleset?.name === "rule-example.yaml") {
              debugger;
            }
            const labels = getLabels(rule.labels || []);

            const transformedMetadata: Metadata = {
              source: labels.sourceLabel,
              target: labels.targetLabel,
              otherLabels: labels.otherLabels,
            };
            return {
              ...rule,
              metadata: transformedMetadata,
            };
          });
          return { ...ruleset, rules: mappedRules };
        });
      },
    }
  );
  return {
    rulesets: data || [],
    isFetching: isLoading,
    fetchError: error,
    refetch,
  };
};

export const useUpdateRulesetMutation = (
  onSuccess: (res: any) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  const { isLoading, mutate, error } = useMutation(updateRuleset, {
    onSuccess: (res) => {
      onSuccess(res);
      queryClient.invalidateQueries([RulesetsQueryKey]);
    },
    onError: (err: AxiosError) => {
      onError(err);
    },
  });
  return {
    mutate,
    isLoading,
    error,
  };
};

export const useDeleteRulesetMutation = (
  onSuccess: (res: any, id: number) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  const { isLoading, mutate, error } = useMutation(deleteRuleset, {
    onSuccess: (res, id) => {
      onSuccess(res, id);
      queryClient.invalidateQueries([RulesetsQueryKey]);
    },
    onError: (err: AxiosError) => {
      onError(err);
      queryClient.invalidateQueries([RulesetsQueryKey]);
    },
  });
  return {
    mutate,
    isLoading,
    error,
  };
};

export const useCreateRulesetMutation = (
  onSuccess: (res: any) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  const { isLoading, mutate, error } = useMutation(createRuleset, {
    onSuccess: (res) => {
      onSuccess(res);
      queryClient.invalidateQueries([RulesetsQueryKey]);
    },
    onError: (err: AxiosError) => {
      onError(err);
    },
  });
  return {
    mutate,
    isLoading,
    error,
  };
};

export const useCreateFileMutation = (
  onSuccess: (res: any, formData: FormData, file: IReadFile) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  const { isLoading, mutate, error } = useMutation(createFile, {
    onSuccess: (res, { formData, file }) => {
      onSuccess(res, formData, file);
      queryClient.invalidateQueries([]);
    },
    onError: (err: AxiosError) => {
      onError(err);
    },
  });
  return {
    mutate,
    isLoading,
    error,
  };
};
