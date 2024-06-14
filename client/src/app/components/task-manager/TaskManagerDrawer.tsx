import React, { forwardRef, useMemo, useState } from "react";
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
import {
  CubesIcon,
  InProgressIcon,
  PauseCircleIcon,
  PendingIcon,
  CheckCircleIcon,
  TaskIcon,
} from "@patternfly/react-icons";

import { TaskState } from "@app/api/models";
import { useTaskManagerContext } from "./TaskManagerContext";
import { useServerTasks } from "@app/queries/tasks";

/** A version of `Task` specific for the task manager drawer components */
interface TaskManagerTask {
  id: number;

  createUser: string;
  updateUser: string;
  createTime: string;
  started?: string;
  terminated?: string;

  name: string;
  kind: string;
  addon: string;
  extensions: string[];
  state: TaskState;
  priority: number;
  application: { id: number; name: string };
  preemptEnabled: boolean;
}

const PAGE_SIZE = 20;

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

const TaskStateToIcon: React.FC<{ task: TaskManagerTask }> = ({ task }) =>
  task.state === "Ready" ? (
    <CheckCircleIcon />
  ) : task.state === "Postponed" ? (
    <PauseCircleIcon />
  ) : task.state === "Pending" ? (
    <PendingIcon />
  ) : task.state === "Running" ? (
    <InProgressIcon />
  ) : (
    <TaskIcon />
  );

const TaskItem: React.FC<{ task: TaskManagerTask }> = ({ task }) => {
  return (
    <NotificationDrawerListItem key={task.id} variant="info">
      <NotificationDrawerListItemHeader
        variant="custom"
        title={`Task ID ${task.id}`}
        icon={<TaskStateToIcon task={task} />}
      ></NotificationDrawerListItemHeader>
      <NotificationDrawerListItemBody timestamp="right about now, funk soul brother"></NotificationDrawerListItemBody>
    </NotificationDrawerListItem>
  );
};

const useTaskManagerData = () => {
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const increasePageSize = () => {
    setPageSize(pageSize + PAGE_SIZE);
  };

  const { result, isFetching } = useServerTasks(
    {
      filters: [{ field: "state", operator: "=", value: "queued" }],
      sort: {
        field: "id",
        direction: "desc",
      },
      page: {
        pageNumber: 1,
        itemsPerPage: pageSize,
      },
    },
    5000
  );
  // {
  //   id: 999,
  //   createUser: "",
  //   updateUser: "",
  //   createTime: "2024-06-13T02:30:47.070179657Z",
  //   name: "Task 999",
  //   kind: "",
  //   addon: "analyzer",
  //   extensions: [],
  //   state: "Ready",
  //   priority: 0,
  //   application: { id: 1, name: "App1" },
  // },

  const tasks: TaskManagerTask[] = useMemo(
    () =>
      !result.data
        ? []
        : result.data.map(
            (task) =>
              ({
                id: task.id ?? -1,
                createUser: task.createUser ?? "",
                updateUser: task.updateUser ?? "",
                createTime: task.createTime ?? "", // TODO: date?
                started: task.started ?? "", // TODO: date?
                terminated: task.terminated ?? "", // TODO: date?
                name: task.name,
                kind: task.kind,
                addon: task.addon,
                extensions: task.extensions,
                state: task.state ?? "",
                priority: task.priority,
                application: task.application,
                preemptEnabled: task?.policy?.preemptEnabled ?? false,

                // TODO: Add any checks that could be needed later...
                //  - isCancelable (does the current user own the task? other things to check?)
                //  - isPreemptionToggleAllowed
              }) as TaskManagerTask
          ),
    [result.data]
  );

  return {
    tasks,
    increasePageSize,
    isFetching,
  };
};
