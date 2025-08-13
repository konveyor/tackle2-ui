import "./column-platform-name.css";

import React from "react";
import { Link } from "react-router-dom";
import dayjs from "dayjs";

import {
  Alert,
  Icon,
  Popover,
  PopoverProps,
  Tooltip,
} from "@patternfly/react-core";
import {
  CheckCircleIcon,
  TimesCircleIcon,
  InProgressIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  PendingIcon,
  ResourcesEmptyIcon,
} from "@patternfly/react-icons";
import { Table, Tbody, Td, Thead, Tr } from "@patternfly/react-table";

import { IconWithLabel, TaskStateIcon } from "@app/components/Icons";
import { Paths } from "@app/Paths";
import { formatPath, universalComparator } from "@app/utils/utils";
import { TaskDashboard } from "@app/api/models";
import {
  SourcePlatformTasksStatus,
  SourcePlatformWithTasks,
} from "../useFetchPlatformsWithTasks";

interface StatusData {
  popoverVariant: PopoverProps["alertSeverityVariant"];
  icon: React.FunctionComponent;
  headerText: string;
}

/* TODO: This can be better aligned with `TaskStateIcon` in future. */
const statusMap: Record<SourcePlatformTasksStatus, StatusData> = {
  None: {
    popoverVariant: undefined,
    headerText: "This source platform has no tasks",
    icon: () => (
      <Icon status="custom">
        <ResourcesEmptyIcon />
      </Icon>
    ),
  },
  Running: {
    popoverVariant: "info",
    headerText: "One or more tasks are running",
    icon: () => (
      <Icon status="info">
        <InProgressIcon />
      </Icon>
    ),
  },
  Queued: {
    popoverVariant: "info",
    headerText: "One or more tasks are queued to run",
    icon: () => (
      <Icon status="info">
        <PendingIcon />
      </Icon>
    ),
  },
  Failed: {
    popoverVariant: "danger",
    headerText: "One or more tasks failed",
    icon: () => (
      <Icon status="danger">
        <ExclamationCircleIcon />
      </Icon>
    ),
  },
  Canceled: {
    popoverVariant: "info",
    headerText: "One of more tasks were canceled",
    icon: () => (
      <Icon status="info">
        <TimesCircleIcon />
      </Icon>
    ),
  },
  Success: {
    popoverVariant: "success",
    headerText: "All tasks succeeded",
    icon: () => (
      <Icon status="success">
        <CheckCircleIcon />
      </Icon>
    ),
  },
  SuccessWithErrors: {
    popoverVariant: "warning",
    headerText: "All tasks succeeded, but some errors occurred",
    icon: () => (
      <Icon status="warning">
        <ExclamationTriangleIcon />
      </Icon>
    ),
  },
};

const linkToTasks = (platformName: string) => {
  const search = `t:filters={"platform":["${platformName}"]}`;
  return `${formatPath(Paths.tasks, {})}?${search}`;
};

const linkToDetails = (task: TaskDashboard) => {
  return formatPath(Paths.taskDetails, {
    taskId: task.id,
  });
};

export const ColumnPlatformName: React.FC<{
  platform: SourcePlatformWithTasks;
}> = ({ platform }) => {
  const status = statusMap[platform.tasks.tasksStatus];
  const StatusIcon = status.icon;

  const bodyContent = (
    <div>
      <Alert
        title={status.headerText}
        variant={status.popoverVariant}
        customIcon={<StatusIcon />}
        isInline
        isPlain
      />
      {platform.tasks.tasksStatus === "None" ? (
        <></>
      ) : (
        <Table variant="compact" borders={false}>
          <Thead>
            <Tr>
              <Td>Id</Td>
              <Td>Kind</Td>
              <Td>Started</Td>
            </Tr>
          </Thead>
          <Tbody>
            {Object.entries(platform.tasks.tasksByKind)
              .sort((a, b) => universalComparator(a[0], b[0]))
              .map(([kind, [task]]) => {
                const startTime = dayjs(task.started ?? task.createTime);
                return (
                  <Tr key={`popover-p${platform.id}-k${kind}`}>
                    <Td>{task.id}</Td>
                    <Td>
                      <IconWithLabel
                        icon={<TaskStateIcon state={task.state} />}
                        label={<Link to={linkToDetails(task)}>{kind}</Link>}
                      />
                    </Td>
                    <Td>
                      <Tooltip content={startTime.format("ll, LTS")}>
                        <span>{startTime.fromNow()}</span>
                      </Tooltip>
                    </Td>
                  </Tr>
                );
              })}
          </Tbody>
        </Table>
      )}
    </div>
  );

  return (
    <Popover
      className="platform-name-popover"
      triggerAction="hover"
      aria-label="application task information popover"
      // alertSeverityVariant={status.popoverVariant}
      // headerIcon={<StatusIcon />}
      // headerContent={status.headerText}
      headerContent={platform.name}
      hasAutoWidth
      bodyContent={bodyContent}
      footerContent={
        <Link to={linkToTasks(platform.name)}>
          View all tasks for the platform
        </Link>
      }
    >
      <IconWithLabel icon={<StatusIcon />} label={platform.name} />
    </Popover>
  );
};
