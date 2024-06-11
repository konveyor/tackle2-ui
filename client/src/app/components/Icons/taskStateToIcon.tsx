import { TaskState } from "@app/api/models";
import React from "react";
import { Icon } from "@patternfly/react-core";
import CheckCircleIcon from "@patternfly/react-icons/dist/esm/icons/check-circle-icon";
import TimesCircleIcon from "@patternfly/react-icons/dist/esm/icons/times-circle-icon";
import InProgressIcon from "@patternfly/react-icons/dist/esm/icons/in-progress-icon";
import ExclamationCircleIcon from "@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon";
import UnknownIcon from "@patternfly/react-icons/dist/esm/icons/unknown-icon";

export const taskStateToIcon = (state?: TaskState) => {
  switch (state) {
    case "not supported":
    case "No task":
      return <UnknownIcon />;
    case "Canceled":
      return <TimesCircleIcon />;
    case "Succeeded":
      return (
        <Icon status={"success"}>
          <CheckCircleIcon />
        </Icon>
      );
    case "Failed":
      return (
        <Icon status={"danger"}>
          <ExclamationCircleIcon />
        </Icon>
      );
    case "Pending":
      return <InProgressIcon />;
    case "Created":
    case "Running":
    case "Ready":
    case "Postponed":
    default:
      return <></>;
  }
};
