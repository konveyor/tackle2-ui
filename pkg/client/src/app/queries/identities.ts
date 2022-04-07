import React from "react";
import { useQuery } from "react-query";

import { getIdentities } from "@app/api/rest";
import { Identity } from "@app/api/models";

export interface IIdentityFetchState {
  identities: Identity[];
  isFetching: boolean;
  fetchError: any;
}

export const useFetchIdentities = (): IIdentityFetchState => {
  const [identities, setIdentities] = React.useState<Identity[]>([]);
  const { isLoading, error } = useQuery("identities", () =>
    getIdentities()
      .then(({ data }) => {
        setIdentities(data);
      })
      .catch((error) => {
        console.log("error, ", error);
      })
  );
  return {
    identities: identities,
    isFetching: isLoading,
    fetchError: error,
  };
};
