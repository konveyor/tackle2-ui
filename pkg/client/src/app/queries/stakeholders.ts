import { useQuery } from "react-query";

import { Stakeholder } from "@app/api/models";
import { getStakeholders } from "@app/api/rest";

export interface IStakeholderFetchState {
  stakeholders: Stakeholder[];
  isFetching: boolean;
  fetchError: any;
}

export const StakeholdersQueryKey = "stakeholders";

export const useFetchStakeholders = (): IStakeholderFetchState => {
  const { data, isLoading, error } = useQuery(
    StakeholdersQueryKey,
    async () => (await getStakeholders()).data,
    {
      onError: (error) => console.log("error, ", error),
    }
  );
  return {
    stakeholders: data || [],
    isFetching: isLoading,
    fetchError: error,
  };
};
