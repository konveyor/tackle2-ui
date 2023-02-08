import { useQuery } from "react-query";

import { getAddons } from "@app/api/rest";

interface FetchAddonsFilters {
  includeBundled?: boolean;
}

export const useFetchAddons = (filters: FetchAddonsFilters = {}) => {
  const { isLoading, error, refetch, data } = useQuery("addons", getAddons, {
    refetchInterval: 5000,
    select: (allAddons) => {
      const filteredAddons = (filters && filters.includeBundled)
        ? allAddons
        : allAddons.filter((addon) => {
          return !(addon.name === "admin") && !(addon.name === "windup");
        });
      return filteredAddons;
    },
    onError: (err) => console.log(err),
  });

  return {
    addons: data || [],
    isFetching: isLoading,
    fetchError: error,
    refetch,
  };
};
