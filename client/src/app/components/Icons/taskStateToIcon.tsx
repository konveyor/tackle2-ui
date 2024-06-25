import { TaskState } from "@app/api/models";
import React from "react";
import { Icon } from "@patternfly/react-core";
import {
  CheckCircleIcon,
  TimesCircleIcon,
  InProgressIcon,
  ExclamationCircleIcon,
  UnknownIcon,
  PendingIcon,
  TaskIcon,
  PauseCircleIcon,
} from "@patternfly/react-icons";

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
    case "Running":
      return <InProgressIcon />;
    case "Pending":
      return <PendingIcon />;
    case "QuotaBlocked":
    case "Postponed":
      return <PauseCircleIcon />;
    case "Created":
    case "Ready":
      return <TaskIcon />;
    default:
      return <TaskIcon />;
  }
};
