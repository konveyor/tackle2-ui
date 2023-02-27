import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getSettingById, updateSetting } from "@app/api/rest";
import {
  Setting,
  FlagSettingKey,
  BundleOrderSettingKey,
} from "@app/api/models";

export const SettingQueryKey = "setting";

export const useSetting = <T>(key: BundleOrderSettingKey | FlagSettingKey) => {
  const queryClient = useQueryClient();

  if (key === "ui.bundle.order") {
    return useQuery({
      queryKey: [SettingQueryKey, key],
      queryFn: () => getSettingById<T>(key),
      onError: (error) => console.log(error),
    });
  }
  return useQuery({
    queryKey: [SettingQueryKey, key],
    queryFn: () => getSettingById<T>(key),
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
