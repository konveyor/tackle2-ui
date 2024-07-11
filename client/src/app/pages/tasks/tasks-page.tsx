import React, { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link, useHistory } from "react-router-dom";
import {
  EmptyState,
  EmptyStateHeader,
  EmptyStateIcon,
  PageSection,
  PageSectionVariants,
  Text,
  TextContent,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from "@patternfly/react-core";
import {
  Table,
  Tbody,
  Th,
  Thead,
  Tr,
  Td,
  ThProps,
} from "@patternfly/react-table";
import { CubesIcon } from "@patternfly/react-icons";

import { FilterToolbar, FilterType } from "@app/components/FilterToolbar";
import {
  ConditionalTableBody,
  TableHeaderContentWithControls,
  TableRowContentWithControls,
} from "@app/components/TableControls";
import {
  deserializeFilterUrlParams,
  getHubRequestParams,
  useTableControlProps,
  useTableControlState,
} from "@app/hooks/table-controls";

import { SimplePagination } from "@app/components/SimplePagination";
import { TablePersistenceKeyPrefix } from "@app/Constants";

import { useSelectionState } from "@migtools/lib-ui";
import { useServerTasks } from "@app/queries/tasks";
import { Task, TaskState } from "@app/api/models";
import { IconWithLabel, TaskStateIcon } from "@app/components/Icons";
import { ManageColumnsToolbar } from "../applications/applications-table/components/manage-columns-toolbar";
import dayjs from "dayjs";
import { formatPath } from "@app/utils/utils";
import { Paths } from "@app/Paths";
import { TaskActionColumn } from "./TaskActionColumn";

const taskStateToLabel: Record<TaskState, string> = {
  "No task": "taskState.NoTask",
  "not supported": "",
  Canceled: "Canceled",
  Created: "Created",
  Succeeded: "Succeeded",
  Failed: "Failed",
  Running: "Running",
  QuotaBlocked: "Quota Blocked",
  Ready: "Ready",
  Pending: "Pending",
  Postponed: "Postponed",
  SucceededWithErrors: "Succeeded with Errors",
};

export const TasksPage: React.FC = () => {
  const { t } = useTranslation();
  const history = useHistory();

  const urlParams = new URLSearchParams(window.location.search);
  const filters = urlParams.get("filters") ?? "";

  const deserializedFilterValues = deserializeFilterUrlParams({ filters });

  const tableControlState = useTableControlState({
    tableName: "tasks-table",
    persistTo: {
      filter: "urlParams",
      pagination: "sessionStorage",
      sort: "sessionStorage",
    },
    persistenceKeyPrefix: TablePersistenceKeyPrefix.tasks,
    columnNames: {
      id: "ID",
      application: t("terms.application"),
      state: t("terms.status"),
      kind: t("terms.kind"),
      priority: t("terms.priority"),
      preemption: t("terms.preemption"),
      createUser: t("terms.createdBy"),
      pod: t("terms.pod"),
      started: t("terms.started"),
      terminated: t("terms.terminated"),
    },
    initialFilterValues: deserializedFilterValues,
    initialColumns: {
      id: { isIdentity: true },
      pod: { isVisible: false },
      started: { isVisible: false },
      terminated: { isVisible: false },
    },
    isFilterEnabled: true,
    isSortEnabled: true,
    isPaginationEnabled: true,
    isActiveItemEnabled: false,
    sortableColumns: [
      "id",
      "state",
      "application",
      "kind",
      "createUser",
      "priority",
    ],
    initialSort: { columnKey: "id", direction: "desc" },
    filterCategories: [
      {
        categoryKey: "id",
        title: "ID",
        type: FilterType.numsearch,
        placeholderText: t("actions.filterBy", {
          what: "ID...",
        }),
        getServerFilterValue: (value) => (value ? value : []),
      },
      {
        categoryKey: "state",
        title: t("terms.status"),
        type: FilterType.search,
        placeholderText: t("actions.filterBy", {
          what: t("terms.status") + "...",
        }),
        getServerFilterValue: (value) => (value ? [`*${value[0]}*`] : []),
      },
      {
        categoryKey: "application",
        title: t("terms.application"),
        type: FilterType.search,
        placeholderText: t("actions.filterBy", {
          what: t("terms.application") + "...",
        }),
        serverFilterField: "application.name",
        getServerFilterValue: (value) => (value ? [`*${value[0]}*`] : []),
      },
      {
        categoryKey: "kind",
        title: t("terms.kind"),
        type: FilterType.search,
        placeholderText: t("actions.filterBy", {
          what: t("terms.kind") + "...",
        }),
        getServerFilterValue: (value) => (value ? [`*${value[0]}*`] : []),
      },
      {
        categoryKey: "createUser",
        title: t("terms.createdBy"),
        type: FilterType.search,
        placeholderText: t("actions.filterBy", {
          what: t("terms.createdBy") + "...",
        }),
        getServerFilterValue: (value) => (value ? [`*${value[0]}*`] : []),
      },
    ],
    initialItemsPerPage: 10,
  });

  const {
    result: { data: currentPageItems = [], total: totalItemCount },
    isFetching,
    fetchError,
  } = useServerTasks(
    getHubRequestParams({
      ...tableControlState,
      hubSortFieldKeys: {
        id: "id",
        state: "state",
        application: "application.name",
        kind: "kind",
        createUser: "createUser",
        priority: "priority",
      },
    }),
    5000
  );

  const tableControls = useTableControlProps({
    ...tableControlState,
    idProperty: "id",
    currentPageItems,
    totalItemCount,
    isLoading: isFetching,
    selectionState: useSelectionState({
      items: currentPageItems,
      isEqual: (a, b) => a.name === b.name,
    }),
  });

  const {
    numRenderedColumns,
    propHelpers: {
      toolbarProps,
      filterToolbarProps,
      paginationToolbarItemProps,
      paginationProps,
      tableProps,
      getThProps,
      getTrProps,
      getTdProps,
      getColumnVisibility,
    },
    columnState,
  } = tableControls;

  const tooltips: Record<string, ThProps["info"]> = {
    priority: { tooltip: t("tooltip.priority") },
    preemption: { tooltip: t("tooltip.preemption") },
  };

  const clearFilters = () => {
    const currentPath = history.location.pathname;
    const newSearch = new URLSearchParams(history.location.search);
    newSearch.delete("filters");
    history.push(`${currentPath}`);
    filterToolbarProps.setFilterValues({});
  };

  const toCells = ({
    id,
    application,
    kind,
    addon,
    state,
    priority = 0,
    policy,
    createUser,
    pod,
    started,
    terminated,
  }: Task) => ({
    id,
    application: application.name,
    kind: kind ?? addon,
    state: (
      <IconWithLabel
        icon={<TaskStateIcon state={state} />}
        label={
          <Link
            to={formatPath(Paths.taskDetails, {
              taskId: id,
            })}
          >
            {t(taskStateToLabel[state ?? "No task"])}
          </Link>
        }
      />
    ),
    priority,
    preemption: String(!!policy?.preemptEnabled),
    createUser,
    pod,
    started: started ? dayjs(started).format("YYYY-MM-DD HH:mm:ss") : "",
    terminated: terminated
      ? dayjs(terminated).format("YYYY-MM-DD HH:mm:ss")
      : "",
  });

  return (
    <>
      <PageSection variant={PageSectionVariants.light}>
        <TextContent>
          <Text component="h1">{t("titles.taskManager")}</Text>
        </TextContent>
      </PageSection>
      <PageSection>
        <div
          style={{
            backgroundColor: "var(--pf-v5-global--BackgroundColor--100)",
          }}
        >
          <Toolbar {...toolbarProps} clearAllFilters={clearFilters}>
            <ToolbarContent>
              <FilterToolbar {...filterToolbarProps} />
              <ManageColumnsToolbar
                columns={columnState.columns}
                setColumns={columnState.setColumns}
                defaultColumns={columnState.defaultColumns}
              />
              <ToolbarItem {...paginationToolbarItemProps}>
                <SimplePagination
                  idPrefix="tasks-table"
                  isTop
                  paginationProps={paginationProps}
                />
              </ToolbarItem>
            </ToolbarContent>
          </Toolbar>

          <Table {...tableProps} id="tasks-table" aria-label="Tasks table">
            <Thead>
              <Tr>
                <TableHeaderContentWithControls {...tableControls}>
                  {columnState.columns
                    .filter(({ id }) => getColumnVisibility(id))
                    .map(({ id }) => (
                      <Th
                        key={id}
                        {...getThProps({ columnKey: id })}
                        info={tooltips[id]}
                      />
                    ))}
                  <Th width={10} />
                </TableHeaderContentWithControls>
              </Tr>
            </Thead>
            <ConditionalTableBody
              isLoading={isFetching}
              isError={!!fetchError}
              isNoData={currentPageItems.length === 0}
              noDataEmptyState={
                <EmptyState variant="sm">
                  <EmptyStateHeader
                    titleText={t("message.noResultsFoundTitle")}
                    headingLevel="h2"
                    icon={<EmptyStateIcon icon={CubesIcon} />}
                  />
                </EmptyState>
              }
              numRenderedColumns={numRenderedColumns}
            >
              <Tbody>
                {currentPageItems
                  ?.map((task): [Task, { [p: string]: ReactNode }] => [
                    task,
                    toCells(task),
                  ])
                  .map(([task, cells], rowIndex) => (
                    <Tr key={task.id} {...getTrProps({ item: task })}>
                      <TableRowContentWithControls
                        {...tableControls}
                        item={task}
                        rowIndex={rowIndex}
                      >
                        {columnState.columns
                          .filter(({ id }) => getColumnVisibility(id))
                          .map(({ id: columnKey }) => (
                            <Td
                              key={`${columnKey}_${task.id}`}
                              {...getTdProps({ columnKey })}
                            >
                              {cells[columnKey]}
                            </Td>
                          ))}
                        <Td
                          key={`row-actions-${task.id}`}
                          isActionCell
                          id={`row-actions-${task.id}`}
                        >
                          <TaskActionColumn task={task} />
                        </Td>
                      </TableRowContentWithControls>
                    </Tr>
                  ))}
              </Tbody>
            </ConditionalTableBody>
          </Table>
          <SimplePagination
            idPrefix="dependencies-table"
            isTop={false}
            paginationProps={paginationProps}
          />
        </div>
      </PageSection>
    </>
  );
};

export default TasksPage;
