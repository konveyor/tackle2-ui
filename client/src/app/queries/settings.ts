import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getSettingById, updateSetting } from "@app/api/rest";
import { Setting, SettingKey } from "@app/api/models";

export const SettingQueryKey = "setting";

export const useSetting = (key: SettingKey) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: [SettingQueryKey, key],
    queryFn: () => getSettingById(key).then((response) => response.data),
    onSuccess: () => queryClient.invalidateQueries([SettingQueryKey]),
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
    onError: (err) => {
      queryClient.invalidateQueries([SettingQueryKey]);
    },
  });
};
