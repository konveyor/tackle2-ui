import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getSettingById, updateSetting } from "@app/api/rest";
import { Setting, SettingKeyBoolean, SettingKeyNumber } from "@app/api/models";

export const SettingQueryKey = "setting";

export const useSetting = (key: SettingKeyBoolean | SettingKeyNumber) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: [SettingQueryKey, key],
    queryFn: () => getSettingById(key),
    onError: (error) => console.log(error),
  });
};

export const useSettingMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (obj: Setting) => updateSetting(obj),
    onSuccess: () => {
      queryClient.invalidateQueries([SettingQueryKey]);
    },
    onError: () => {
      queryClient.invalidateQueries([SettingQueryKey]);
    },
  });
};
