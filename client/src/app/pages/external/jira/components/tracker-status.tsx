import React from "react";
import { StatusIcon } from "@migtools/lib-ui";

import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

interface ITrackerStatusProps {
  connected: boolean;
}
const TrackerStatus = ({ connected }: ITrackerStatusProps) => {
  return (
    <>
      <StatusIcon status={connected ? "Ok" : "Error"} />
      <span className={spacing.mlSm}>
        {connected ? "Connected" : "Not connected "}
      </span>
    </>
  );
};

export default TrackerStatus;
