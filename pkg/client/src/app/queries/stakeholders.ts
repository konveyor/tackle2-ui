import React from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";

import { AxiosError } from "axios";
import { Stakeholder } from "@app/api/models";
import { getStakeholders } from "@app/api/rest";

export interface IStakeholderFetchState {
  stakeholders: Stakeholder[];
  isFetching: boolean;
  fetchError: any;
}

export const StakeholdersQueryKey = "stakeholders";

export const useFetchStakeholders = (): IStakeholderFetchState => {
  const [stakeholders, setStakeholders] = React.useState<Stakeholder[]>([]);
  const { isLoading, error } = useQuery(StakeholdersQueryKey, () =>
    getStakeholders()
      .then(({ data }) => {
        setStakeholders(data);
        return data;
      })
      .catch((error) => {
        console.log("error, ", error);
        return error;
      })
  );
  return {
    stakeholders,
    isFetching: isLoading,
    fetchError: error,
  };
};
