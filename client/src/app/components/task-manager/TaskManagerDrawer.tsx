import React, { forwardRef } from "react";
import { Link } from "react-router-dom";
import {
  NotificationDrawer,
  NotificationDrawerBody,
  NotificationDrawerHeader,
  NotificationDrawerList,
} from "@patternfly/react-core";
import { useTaskManagerContext } from "./TaskManagerContext";

interface TaskManagerDrawerProps {
  ref?: React.ForwardedRef<HTMLElement>;
}

export const TaskManagerDrawer: React.FC<TaskManagerDrawerProps> = forwardRef(
  (_props, ref) => {
    const { isExpanded, setIsExpanded, queuedCount } = useTaskManagerContext();

    const closeDrawer = () => {
      setIsExpanded(!isExpanded);
    };

    return (
      <NotificationDrawer ref={ref}>
        <NotificationDrawerHeader
          title="Task Manager"
          customText={`${queuedCount} queued`}
          onClose={closeDrawer}
        >
          <Link to="/tasks">View All Tasks</Link>
        </NotificationDrawerHeader>
        <NotificationDrawerBody>
          <NotificationDrawerList></NotificationDrawerList>
        </NotificationDrawerBody>
      </NotificationDrawer>
    );
  }
);

TaskManagerDrawer.displayName = "TaskManagerDrawer";
