import React from "react";
import { Link } from "react-router-dom";

import { Icon, Popover, PopoverProps, Tooltip } from "@patternfly/react-core";
import {
  CheckCircleIcon,
  TimesCircleIcon,
  InProgressIcon,
  ExclamationCircleIcon,
  PendingIcon,
} from "@patternfly/react-icons";

import { IconWithLabel, TaskStateIcon } from "@app/components/Icons";
import {
  ApplicationTasksStatus,
  DecoratedApplication,
} from "../useDecoratedApplications";
import { Paths } from "@app/Paths";
import { formatPath, universalComparator } from "@app/utils/utils";
import dayjs from "dayjs";
import { Table, Tbody, Td, Thead, Tr } from "@patternfly/react-table";
import { Task } from "@app/api/models";

interface StatusData {
  popoverVariant: PopoverProps["alertSeverityVariant"];
  icon: React.FunctionComponent;
  headerText: string;
}

/* TODO: This can be better aligned with `TaskStateIcon` in future. */
const statusMap: Record<ApplicationTasksStatus, StatusData> = {
  None: {
    popoverVariant: undefined,
    headerText: "This application has no tasks",
    icon: () => <TimesCircleIcon />,
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
};

const linkToTasks = (applicationName: string) => {
  const search = `t:filters={"application":["${applicationName}"]}`;
  return `${formatPath(Paths.tasks, {})}?${search}`;
};

const linkToDetails = (task: Task) => {
  return formatPath(Paths.taskDetails, {
    taskId: task.id,
  });
};

export const ColumnApplicationName: React.FC<{
  application: DecoratedApplication;
}> = ({ application }) => {
  const status = statusMap[application.tasksStatus];
  const StatusIcon = status.icon;

  const bodyContent =
    application.tasksStatus === "None" ? (
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
          {Object.entries(application.tasksByKind)
            .sort((a, b) => universalComparator(a[0], b[0]))
            .map(([kind, [task]]) => {
              const startTime = dayjs(task.started ?? task.createTime);
              return (
                <Tr key={`popover-a${application.id}-k${kind}`}>
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
    );

  return (
    <Popover
      triggerAction="hover"
      aria-label="application task information popover"
      alertSeverityVariant={status.popoverVariant}
      headerIcon={<StatusIcon />}
      headerContent={status.headerText}
      hasAutoWidth
      bodyContent={bodyContent}
      footerContent={
        <Link to={linkToTasks(application.name)}>
          View all tasks for the application
        </Link>
      }
    >
      <IconWithLabel icon={<StatusIcon />} label={application.name} />
    </Popover>
  );
};
