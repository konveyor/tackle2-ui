import React, { forwardRef, useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import {
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
  MenuToggleElement,
  NotificationDrawer,
  NotificationDrawerBody,
  NotificationDrawerHeader,
  NotificationDrawerList,
  NotificationDrawerListItem,
  NotificationDrawerListItemBody,
  NotificationDrawerListItemHeader,
  Tooltip,
  EmptyState,
  EmptyStateHeader,
  EmptyStateIcon,
  EmptyStateBody,
  EmptyStateVariant,
} from "@patternfly/react-core";
import { EllipsisVIcon, CubesIcon } from "@patternfly/react-icons";
import { css } from "@patternfly/react-styles";

import { Task, TaskState } from "@app/api/models";
import { useTaskManagerContext } from "./TaskManagerContext";
import { useInfiniteServerTasks } from "@app/queries/tasks";

import "./TaskManagerDrawer.css";
import { TaskStateIcon } from "../Icons";
import { useTaskActions } from "@app/pages/tasks/useTaskActions";
import { InfiniteScroller } from "../InfiniteScroller";

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
  applicationId: number;
  applicationName: string;
  preemptEnabled: boolean;

  // full object to be used with library functions
  _: Task;
}

const PAGE_SIZE = 20;

interface TaskManagerDrawerProps {
  ref?: React.ForwardedRef<HTMLElement>;
}

export const TaskManagerDrawer: React.FC<TaskManagerDrawerProps> = forwardRef(
  (_props, ref) => {
    const { isExpanded, setIsExpanded, queuedCount } = useTaskManagerContext();
    const { tasks, hasNextPage, fetchNextPage, pageSize } =
      useTaskManagerData();

    const [expandedItems, setExpandedItems] = useState<number[]>([]);
    const [taskWithExpandedActions, setTaskWithExpandedAction] = useState<
      number | boolean
    >(false);

    const closeDrawer = () => {
      setIsExpanded(!isExpanded);
      setExpandedItems([]);
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
            </EmptyState>
          ) : (
            <InfiniteScroller
              fetchMore={fetchNextPage}
              hasMore={hasNextPage}
              itemCount={tasks?.length ?? 0}
              pageSize={pageSize}
            >
              <NotificationDrawerList>
                {tasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    expanded={expandedItems.includes(task.id)}
                    onExpandToggle={(expand) => {
                      setExpandedItems(
                        expand
                          ? [...expandedItems, task.id]
                          : expandedItems.filter((i) => i !== task.id)
                      );
                    }}
                    actionsExpanded={task.id === taskWithExpandedActions}
                    onActionsExpandToggle={(flag: boolean) =>
                      setTaskWithExpandedAction(flag && task.id)
                    }
                  />
                ))}
              </NotificationDrawerList>
            </InfiniteScroller>
          )}
        </NotificationDrawerBody>
      </NotificationDrawer>
    );
  }
);
TaskManagerDrawer.displayName = "TaskManagerDrawer";

const TaskStateToIcon: React.FC<{ taskState: TaskState }> = ({ taskState }) => (
  <Tooltip content={taskState}>
    <TaskStateIcon state={taskState} />
  </Tooltip>
);

const TaskItem: React.FC<{
  task: TaskManagerTask;
  expanded: boolean;
  onExpandToggle: (expand: boolean) => void;
  actionsExpanded: boolean;
  onActionsExpandToggle: (expand: boolean) => void;
}> = ({
  task,
  expanded,
  onExpandToggle,
  actionsExpanded,
  onActionsExpandToggle,
}) => {
  const starttime = dayjs(task.started ?? task.createTime);
  const title = expanded
    ? `${task.id} (${task.addon})`
    : `${task.id} (${task.addon}) - ${task.applicationName} - ${
        task.priority ?? 0
      }`;
  const taskActionItems = useTaskActions(task._);

  return (
    <NotificationDrawerListItem
      key={task.id}
      variant="info"
      className={css(
        expanded && "task-manager-item-expanded",
        !expanded && "task-manager-item-collapsed"
      )}
      onClick={() => onExpandToggle(!expanded)}
    >
      <NotificationDrawerListItemHeader
        variant="custom"
        title={title}
        icon={<TaskStateToIcon taskState={task.state} />}
      >
        <Dropdown
          onSelect={() => onActionsExpandToggle(false)}
          isOpen={actionsExpanded}
          onOpenChange={() => onActionsExpandToggle(false)}
          popperProps={{ position: "right" }}
          toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
            <MenuToggle
              ref={toggleRef}
              isExpanded={actionsExpanded}
              isDisabled={taskActionItems.every(({ isDisabled }) => isDisabled)}
              onClick={() => onActionsExpandToggle(!actionsExpanded)}
              variant="plain"
              aria-label={`Actions for task ${task.name}`}
            >
              <EllipsisVIcon aria-hidden="true" />
            </MenuToggle>
          )}
        >
          <DropdownList>
            {taskActionItems.map(({ title, onClick, isDisabled }) => (
              <DropdownItem
                key={title}
                onClick={onClick}
                isDisabled={isDisabled}
              >
                {title}
              </DropdownItem>
            ))}
          </DropdownList>
        </Dropdown>
      </NotificationDrawerListItemHeader>
      {expanded ? (
        <NotificationDrawerListItemBody
          timestamp={
            <Tooltip content={starttime.format("ll, LTS")}>
              <span>{starttime.fromNow()}</span>
            </Tooltip>
          }
        >
          <div>{task.applicationName}</div>
          {/* TODO: Link to /applications with filter applied? */}
          <div>Priority {task.priority}</div>
          {/* TODO: Bucket to Low, Medium, High? */}
        </NotificationDrawerListItemBody>
      ) : undefined}
    </NotificationDrawerListItem>
  );
};

const useTaskManagerData = () => {
  const {
    data,
    fetchNextPage,
    hasNextPage = false,
    isFetching,
    isFetchingNextPage,
  } = useInfiniteServerTasks(
    {
      filters: [{ field: "state", operator: "=", value: "queued" }],
      sort: {
        field: "id",
        direction: "desc",
      },
      page: {
        pageNumber: 1,
        itemsPerPage: PAGE_SIZE,
      },
    },
    5000
  );

  const tasks: TaskManagerTask[] = useMemo(
    () =>
      data?.pages
        ?.flatMap((data) => data?.data ?? [])
        ?.map(
          (task) =>
            ({
              id: task.id ?? -1,
              createUser: task.createUser ?? "",
              updateUser: task.updateUser ?? "",
              createTime: task.createTime ?? "",
              started: task.started ?? "",
              terminated: task.terminated ?? "",
              name: task.name,
              kind: task.kind,
              addon: task.addon,
              extensions: task.extensions,
              state: task.state ?? "",
              priority: task.priority ?? 0,
              applicationId: task.application.id,
              applicationName: task.application.name,
              preemptEnabled: task?.policy?.preemptEnabled ?? false,

              _: task,

              // TODO: Add any checks that could be needed later...
              //  - isCancelable (does the current user own the task? other things to check?)
              //  - isPreemptionToggleAllowed
            }) as TaskManagerTask
        ) ?? [],
    [data]
  );

  // note that the callback will change when query fetching state changes
  const fetchMore = useCallback(() => {
    // forced fetch is not allowed when background fetch or other forced fetch is in progress
    if (!isFetching && !isFetchingNextPage) {
      fetchNextPage();
      return true;
    } else {
      return false;
    }
  }, [isFetching, isFetchingNextPage, fetchNextPage]);

  return {
    tasks,
    isFetching,
    hasNextPage,
    fetchNextPage: fetchMore,
    pageSize: PAGE_SIZE,
  };
};
