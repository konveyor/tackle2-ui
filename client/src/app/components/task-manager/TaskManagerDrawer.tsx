import React, { forwardRef } from "react";
import { Link } from "react-router-dom";
import {
  NotificationDrawer,
  NotificationDrawerBody,
  NotificationDrawerHeader,
  NotificationDrawerList,
  NotificationDrawerListItem,
  NotificationDrawerListItemBody,
  NotificationDrawerListItemHeader,
} from "@patternfly/react-core";
import { useTaskManagerContext } from "./TaskManagerContext";
import { Task } from "@app/api/models";

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
          {/* TODO: add an empty state */}
          <NotificationDrawerList>
            <TaskItem
              task={{
                id: 999,
                application: { id: 1 },
                name: "Task 999",
                addon: "analyzer",
                data: {
                  tagger: { enabled: true },
                  verbosity: 0,
                  mode: { artifact: "", binary: false, withDeps: false },
                  scope: {
                    withKnownLibs: false,
                    packages: { included: [], excluded: [] },
                  },
                },
              }}
            />
          </NotificationDrawerList>
        </NotificationDrawerBody>
      </NotificationDrawer>
    );
  }
);

const TaskItem: React.FC<{ task: Task }> = ({ task }) => (
  <NotificationDrawerListItem key={task.id} variant="info">
    <NotificationDrawerListItemHeader
      variant="success"
      title={`Task ID ${task.id}`}
      // icon={}   TODO: Icon based on Task status
    ></NotificationDrawerListItemHeader>
    <NotificationDrawerListItemBody timestamp="right about now, funk soul brother"></NotificationDrawerListItemBody>
  </NotificationDrawerListItem>
);

TaskManagerDrawer.displayName = "TaskManagerDrawer";
