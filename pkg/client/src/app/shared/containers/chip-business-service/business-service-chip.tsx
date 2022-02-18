import React, { useCallback, useEffect } from "react";

import { useFetch } from "@app/shared/hooks";
import { NodeFetch } from "@app/shared/components";

import { BusinessService } from "@app/api/models";
import { getBusinessServiceById } from "@app/api/rest";

export interface IChipBusinessServiceProps {
  id: number | string;
}

export const ChipBusinessService: React.FC<IChipBusinessServiceProps> = ({
  id,
}) => {
  const onFetchBusinessService = useCallback(() => {
    return getBusinessServiceById(id);
  }, [id]);

  const {
    data: businessService,
    isFetching,
    fetchError,
    requestFetch: refreshBusinessService,
  } = useFetch<BusinessService>({
    defaultIsFetching: true,
    onFetch: onFetchBusinessService,
  });

  useEffect(() => {
    refreshBusinessService();
  }, [refreshBusinessService]);

  return (
    <NodeFetch
      isFetching={isFetching}
      fetchError={fetchError}
      node={businessService?.name}
    />
  );
};
