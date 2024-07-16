import { TaskState } from "@app/api/models";
import React, { FC } from "react";
import { Icon } from "@patternfly/react-core";
import {
  CheckCircleIcon,
  TimesCircleIcon,
  InProgressIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  UnknownIcon,
  PendingIcon,
  TaskIcon,
  PauseCircleIcon,
} from "@patternfly/react-icons";

export const TaskStateIcon: FC<{ state?: TaskState }> = ({ state }) => {
  switch (state) {
    case "not supported":
    case "No task":
      return <UnknownIcon />;
    case "Canceled":
      return (
        <Icon status="info">
          <TimesCircleIcon />
        </Icon>
      );
    case "Succeeded":
      return (
        <Icon status="success">
          <CheckCircleIcon />
        </Icon>
      );
    case "SucceededWithErrors":
      return (
        <Icon status="warning">
          <ExclamationTriangleIcon />
        </Icon>
      );
    case "Failed":
      return (
        <Icon status="danger">
          <ExclamationCircleIcon />
        </Icon>
      );
    case "Running":
      return (
        <Icon status="info">
          <InProgressIcon />
        </Icon>
      );
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
