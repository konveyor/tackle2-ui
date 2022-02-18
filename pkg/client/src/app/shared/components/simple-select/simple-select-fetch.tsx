import React from "react";
import { AxiosError } from "axios";

import { WarningTriangleIcon } from "@patternfly/react-icons/dist/esm/icons/warning-triangle-icon";

import { getAxiosErrorMessage } from "@app/utils/utils";
import { ISimpleSelectProps, SimpleSelect } from "./simple-select";

export interface ISimpleSelectFetchProps
  extends Omit<ISimpleSelectProps, "toggleIcon" | "customContent"> {
  isFetching: boolean;
  fetchError?: AxiosError;
}

export const SimpleSelectFetch: React.FC<ISimpleSelectFetchProps> = ({
  isFetching,
  fetchError,
  ...props
}) => {
  let customContent;
  if (isFetching) {
    customContent = <div>&nbsp;Loading...</div>;
  } else if (fetchError) {
    customContent = <div>&nbsp;{getAxiosErrorMessage(fetchError)}</div>;
  }

  return (
    <SimpleSelect
      toggleIcon={fetchError && <WarningTriangleIcon />}
      customContent={customContent}
      {...props}
    />
  );
};
