import React, { useCallback, useEffect } from "react";

import { useFetch } from "@app/shared/hooks";
import { NodeFetch } from "@app/shared/components";

import { BusinessService } from "@app/api/models";
import { getTagById } from "@app/api/rest";

export interface IChipTagProps {
  id: number | string;
}

export const ChipTag: React.FC<IChipTagProps> = ({ id }) => {
  const onFetchTag = useCallback(() => {
    return getTagById(id);
  }, [id]);

  const {
    data: tag,
    isFetching,
    fetchError,
    requestFetch: refreshTag,
  } = useFetch<BusinessService>({
    defaultIsFetching: true,
    onFetch: onFetchTag,
  });

  useEffect(() => {
    refreshTag();
  }, [refreshTag]);

  return (
    <NodeFetch
      isFetching={isFetching}
      fetchError={fetchError}
      node={tag?.name}
    />
  );
};
