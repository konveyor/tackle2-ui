import React, { forwardRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  EmptyState,
  EmptyStateActions,
  EmptyStateBody,
  EmptyStateFooter,
  EmptyStateHeader,
  EmptyStateIcon,
  EmptyStateVariant,
  NotificationDrawer,
  NotificationDrawerBody,
  NotificationDrawerHeader,
  NotificationDrawerList,
  NotificationDrawerListItem,
  NotificationDrawerListItemBody,
  NotificationDrawerListItemHeader,
} from "@patternfly/react-core";
import CubesIcon from "@patternfly/react-icons/dist/esm/icons/cubes-icon";

import { Task } from "@app/api/models";
import { useTaskManagerContext } from "./TaskManagerContext";

interface TaskManagerDrawerProps {
  ref?: React.ForwardedRef<HTMLElement>;
}

export const TaskManagerDrawer: React.FC<TaskManagerDrawerProps> = forwardRef(
  (_props, ref) => {
    const { isExpanded, setIsExpanded, queuedCount } = useTaskManagerContext();
    const { tasks } = useTaskManagerData();

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
          {tasks.length == 0 ? (
            <EmptyState variant={EmptyStateVariant.full}>
              <EmptyStateHeader
                headingLevel="h2"
                titleText="There are no queued tasks"
                icon={<EmptyStateIcon icon={CubesIcon} />}
              />
              <EmptyStateBody>
                No tasks are currently ready, postponed, blocked, pending or
                running. Completed and cancelled tasks may be viewed on the full
                task list.
              </EmptyStateBody>
              <EmptyStateFooter>
                <EmptyStateActions>
                  <Link to="/tasks">View All Tasks</Link>
                </EmptyStateActions>
              </EmptyStateFooter>
            </EmptyState>
          ) : (
            <NotificationDrawerList>
              {tasks.map((task) => (
                <TaskItem key={task.id} task={task} />
              ))}
            </NotificationDrawerList>
          )}
        </NotificationDrawerBody>
      </NotificationDrawer>
    );
  }
);
TaskManagerDrawer.displayName = "TaskManagerDrawer";

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

const useTaskManagerData = () => {
  const [pageSize, setPageSize] = useState(20);
  const increasePageSize = () => {
    setPageSize(pageSize + 20);
  };

  const tasks: Task[] = [
    // {
    //   id: 999,
    //   application: { id: 1 },
    //   name: "Task 999",
    //   addon: "analyzer",
    //   data: {
    //     tagger: { enabled: true },
    //     verbosity: 0,
    //     mode: { artifact: "", binary: false, withDeps: false },
    //     scope: {
    //       withKnownLibs: false,
    //       packages: { included: [], excluded: [] },
    //     },
    //   },
    // },
  ];

  return {
    tasks,
    increasePageSize,
  };
};
