import * as React from "react";
import { Link, useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Toolbar, ToolbarContent, ToolbarItem } from "@patternfly/react-core";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import { SimplePagination } from "@app/components/SimplePagination";
import { useServerTasks } from "@app/queries/tasks";
import { FilterToolbar, FilterType } from "@app/components/FilterToolbar";
import {
  useTableControlState,
  useTableControlProps,
  getHubRequestParams,
  deserializeFilterUrlParams,
} from "@app/hooks/table-controls";
import { TablePersistenceKeyPrefix } from "@app/Constants";
import { TaskActionColumn } from "@app/pages/tasks/TaskActionColumn";
import {
  ConditionalTableBody,
  TableHeaderContentWithControls,
  TableRowContentWithControls,
} from "@app/components/TableControls";
import { IconWithLabel, TaskStateIcon } from "@app/components/Icons";
import { taskStateToLabel } from "@app/pages/tasks/tasks-page";
import { formatPath } from "@app/utils/utils";
import { Paths } from "@app/Paths";
import { DecoratedApplication } from "../useDecoratedApplications";

export const TabTasksContent: React.FC<{
  application: DecoratedApplication;
}> = ({ application }) => {
  const { t } = useTranslation();
  const history = useHistory();
  const urlParams = new URLSearchParams(window.location.search);
  const filters = urlParams.get("filters");
  const deserializedFilterValues = deserializeFilterUrlParams({ filters });
  const tableControlState = useTableControlState({
    tableName: "tasks-apps-table",
    persistTo: "urlParams",
    persistenceKeyPrefix: TablePersistenceKeyPrefix.tasks,
    columnNames: {
      taskId: "Task ID",
      taskKind: "Task Kind",
      status: "Status",
    },
    isFilterEnabled: true,
    isSortEnabled: true,
    isPaginationEnabled: true,
    sortableColumns: ["taskId", "taskKind", "status"],
    initialSort: { columnKey: "taskId", direction: "asc" },
    initialFilterValues: deserializedFilterValues,
    filterCategories: [
      {
        categoryKey: "id",
        title: "ID",
        type: FilterType.numsearch,
        placeholderText: t("actions.filterBy", {
          what: "ID...",
        }),
        getServerFilterValue: (value) => {
          return value ? value : [];
        },
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
        categoryKey: "state",
        title: t("terms.status"),
        type: FilterType.search,
        placeholderText: t("actions.filterBy", {
          what: t("terms.status") + "...",
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
        taskId: "id",
        taskKind: "kind",
        status: "status",
      },
      implicitFilters: [
        {
          field: "application.id",
          operator: "=",
          value: application.id,
        },
      ],
    }),
    5000
  );
  const tableControls = useTableControlProps({
    ...tableControlState,
    idProperty: "id",
    currentPageItems: currentPageItems,
    totalItemCount,
    isLoading: isFetching,
    variant: "compact",
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
    },
  } = tableControls;

  const clearFilters = () => {
    const currentPath = history.location.pathname;
    const newSearch = new URLSearchParams(history.location.search);
    newSearch.delete("filters");
    history.push(`${currentPath}`);
  };
  return (
    <>
      <Toolbar
        {...toolbarProps}
        className={spacing.mtSm}
        clearAllFilters={clearFilters}
      >
        <ToolbarContent>
          <FilterToolbar {...filterToolbarProps} />
          <ToolbarItem {...paginationToolbarItemProps}>
            <SimplePagination
              idPrefix="task-apps-table"
              isTop
              isCompact
              paginationProps={paginationProps}
            />
          </ToolbarItem>
        </ToolbarContent>
      </Toolbar>
      <Table {...tableProps} aria-label="task applications table">
        <Thead>
          <Tr>
            <TableHeaderContentWithControls {...tableControls}>
              <Th {...getThProps({ columnKey: "taskId" })} />
              <Th
                {...getThProps({ columnKey: "taskKind" })}
                modifier="nowrap"
              />
              <Th {...getThProps({ columnKey: "status" })} modifier="nowrap" />
              <Th screenReaderText="row actions" />
            </TableHeaderContentWithControls>
          </Tr>
        </Thead>

        <ConditionalTableBody
          isLoading={isFetching}
          isError={!!fetchError}
          isNoData={totalItemCount === 0}
          numRenderedColumns={numRenderedColumns}
        >
          <Tbody>
            {currentPageItems?.map((task, rowIndex) => (
              <Tr key={task.id} {...getTrProps({ item: task })}>
                <TableRowContentWithControls
                  {...tableControls}
                  item={task}
                  rowIndex={rowIndex}
                >
                  <Td {...getTdProps({ columnKey: "taskId" })}>{task.id}</Td>
                  <Td {...getTdProps({ columnKey: "taskKind" })}>
                    {task.kind}
                  </Td>
                  <Td {...getTdProps({ columnKey: "status" })}>
                    <IconWithLabel
                      icon={<TaskStateIcon state={task.state} />}
                      label={
                        <Link
                          to={formatPath(Paths.applicationsTaskDetails, {
                            applicationId: application.id,
                            taskId: task.id,
                          })}
                        >
                          {t(taskStateToLabel[task.state ?? "No task"])}
                        </Link>
                      }
                    />
                  </Td>
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
        idPrefix="task-apps-table"
        isTop={false}
        isCompact
        paginationProps={paginationProps}
      />
    </>
  );
};
