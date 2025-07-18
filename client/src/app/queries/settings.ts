import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getSettingById, updateSetting } from "@app/api/rest";
import { SettingTypes } from "@app/api/models";
import { DEFAULT_REFETCH_INTERVAL } from "@app/Constants";

export const SettingQueryKey = "setting";

export const useSetting = <K extends keyof SettingTypes>(
  key: K,
  refetchInterval: number | false = DEFAULT_REFETCH_INTERVAL
) => {
  return useQuery({
    queryKey: [SettingQueryKey, key],
    queryFn: () => getSettingById<K>(key),
    onError: (error) => console.log(error),
    refetchInterval,
  });
};
export const useSettingMutation = <K extends keyof SettingTypes>(key: K) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (value: SettingTypes[K]) => updateSetting({ key, value }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SettingQueryKey] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: [SettingQueryKey] });
    },
  });
};
