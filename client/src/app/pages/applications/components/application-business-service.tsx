import React from "react";

import { useFetchBusinessServiceById } from "@app/queries/businessservices";

export interface ApplicationBusinessServiceProps {
  id: number | string | undefined;
}

export const ApplicationBusinessService: React.FC<
  ApplicationBusinessServiceProps
> = ({ id }) => {
  const { businessService, fetchError } = useFetchBusinessServiceById(id || "");

  if (fetchError) {
    return <></>;
  }

  return <>{businessService?.name}</>;
};
