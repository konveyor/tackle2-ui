import React, { useCallback, useEffect } from "react";

import { useFetch } from "@app/shared/hooks";

import { BusinessService } from "@app/api/models";
import { getBusinessServiceById } from "@app/api/rest";

export interface ApplicationBusinessServiceProps {
  id: number | string;
}

export const ApplicationBusinessService: React.FC<
  ApplicationBusinessServiceProps
> = ({ id }) => {
  const onFetchBusinessService = useCallback(() => {
    return getBusinessServiceById(id);
  }, [id]);

  const {
    data: businessService,
    fetchError,
    requestFetch: refreshBusinessService,
  } = useFetch<BusinessService>({
    defaultIsFetching: true,
    onFetch: onFetchBusinessService,
  });

  useEffect(() => {
    refreshBusinessService();
  }, [refreshBusinessService]);

  if (fetchError) {
    return <></>;
  }

  return <>{businessService?.name}</>;
};
