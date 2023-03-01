import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getSettingById, updateSetting } from "@app/api/rest";
import { Setting, SettingTypes } from "@app/api/models";

export const SettingQueryKey = "setting";

export const useSetting = <K extends keyof SettingTypes>(key: K) => {
  return useQuery({
    queryKey: [SettingQueryKey, key],
    queryFn: () => getSettingById<K>(key),
    onError: (error) => console.log(error),
  });
};
export const useSettingMutation = <K extends keyof SettingTypes>(key: K) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (value: SettingTypes[K]) => updateSetting({ key, value }),
    onSuccess: () => {
      queryClient.invalidateQueries([SettingQueryKey]);
    },
    onError: () => {
      queryClient.invalidateQueries([SettingQueryKey]);
    },
  });
};
