import React from "react";

import { useFetchBusinessServiceByID } from "@app/queries/businessservices";

export interface ApplicationBusinessServiceProps {
  id: number | string | undefined;
}

export const ApplicationBusinessService: React.FC<
  ApplicationBusinessServiceProps
> = ({ id }) => {
  const { businessService, fetchError } = useFetchBusinessServiceByID(id || "");

  if (fetchError) {
    return <></>;
  }

  return <>{businessService?.name}</>;
};
