import React from "react";
import { NotificationBadge } from "@patternfly/react-core";

import { useTaskManagerContext } from "./TaskManagerContext";

export const TaskNotificationBadge: React.FC = () => {
  const { isExpanded, setIsExpanded, queuedCount } = useTaskManagerContext();

  const badgeClick = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <NotificationBadge
      id="task-notification-badge"
      aria-label="Count of queued tasks"
      variant={queuedCount > 0 ? "unread" : "read"}
      count={queuedCount}
      onClick={badgeClick}
      isExpanded={isExpanded}
    />
  );
};
