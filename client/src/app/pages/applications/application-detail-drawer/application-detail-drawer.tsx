import * as React from "react";
import { Link, useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
  TextContent,
  Text,
  Title,
  Tabs,
  Tab,
  TabTitleText,
} from "@patternfly/react-core";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import { Manifest } from "@app/api/models";

import {
  IPageDrawerContentProps,
  PageDrawerContent,
} from "@app/components/PageDrawerContext";
import { ReviewFields } from "@app/components/detail-drawer/review-fields";

import { formatPath } from "@app/utils/utils";
import { Paths } from "@app/Paths";
import { DecoratedApplication } from "../useDecoratedApplications";
import { Toolbar, ToolbarContent, ToolbarItem } from "@patternfly/react-core";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
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
import { SchemaDefinedField } from "@app/components/schema-defined-fields/SchemaDefinedFields";
import { useFetchApplicationManifest } from "@app/queries/applications";
import { usePlatformCoordinatesProvider } from "../usePlatformCoordinatesProvider";
import { TabDetailsContent } from "./tab-details-content";
import { TabTagsContent } from "./tab-tags-content";
import { TabReportsContent } from "./tab-reports-contents";

export interface IApplicationDetailDrawerProps
  extends Pick<IPageDrawerContentProps, "onCloseClick"> {
  application: DecoratedApplication | null;
  onEditClick: () => void;
}

export enum TabKey {
  Details = 0,
  Tags,
  Reports,
  Facts,
  Reviews,
  Tasks,
  Manifest,
  PlatformCoordinates,
}

export const ApplicationDetailDrawer: React.FC<
  IApplicationDetailDrawerProps
> = ({ application, onCloseClick, onEditClick }) => {
  const { t } = useTranslation();

  const [activeTabKey, setActiveTabKey] = React.useState<TabKey>(
    TabKey.Details
  );

  const manifest = useFetchApplicationManifest(application?.id).manifest;

  return (
    <PageDrawerContent
      isExpanded={!!application}
      onCloseClick={onCloseClick}
      focusKey={application?.id}
      pageKey="app-inventory"
      header={
        <TextContent>
          <Text component="small" className={spacing.mb_0}>
            {t("terms.name")}
          </Text>
          <Title headingLevel="h2" size="lg" className={spacing.mtXs}>
            {application?.name}
          </Title>
        </TextContent>
      }
    >
      <div>
        {/* this div is required so the tabs are visible */}
        <Tabs
          activeKey={activeTabKey}
          onSelect={(_event, tabKey) => setActiveTabKey(tabKey as TabKey)}
          className={spacing.mtLg}
        >
          {!application ? null : (
            <Tab
              eventKey={TabKey.Details}
              title={<TabTitleText>{t("terms.details")}</TabTitleText>}
            >
              <TabDetailsContent
                application={application}
                onCloseClick={onCloseClick}
                onEditClick={onEditClick}
              />
            </Tab>
          )}

          {!application ? null : (
            <Tab
              eventKey={TabKey.Tags}
              title={<TabTitleText>Tags</TabTitleText>}
            >
              <TabTagsContent application={application} />
            </Tab>
          )}

          {!application ? null : (
            <Tab
              eventKey={TabKey.Reports}
              title={<TabTitleText>{t("terms.reports")}</TabTitleText>}
            >
              <TabReportsContent application={application} />
            </Tab>
          )}

          {!application ? null : (
            <Tab
              eventKey={TabKey.Reviews}
              title={<TabTitleText>{t("terms.review")}</TabTitleText>}
            >
              <ReviewFields application={application} />
            </Tab>
          )}
          {!application ? null : (
            <Tab
              eventKey={TabKey.Tasks}
              title={<TabTitleText>{t("terms.tasks")}</TabTitleText>}
            >
              <TabTasksContent application={application} />
            </Tab>
          )}
          {!application || !manifest ? null : (
            <Tab
              eventKey={TabKey.Manifest}
              title={<TabTitleText>{t("terms.manifest")}</TabTitleText>}
            >
              <TabManifestContent manifest={manifest} />
            </Tab>
          )}
          {!application || !application.platform ? null : (
            <Tab
              eventKey={TabKey.PlatformCoordinates}
              title={<TabTitleText>Platform Coordinates</TabTitleText>}
            >
              <TabPlatformCoordinatesContent application={application} />
            </Tab>
          )}
        </Tabs>
      </div>
    </PageDrawerContent>
  );
};

const TabPlatformCoordinatesContent: React.FC<{
  application: DecoratedApplication;
}> = ({ application }) => {
  // TODO: get the platform coordinates from the application
  const { schema, document } = usePlatformCoordinatesProvider();
  return (
    <SchemaDefinedField
      className={spacing.mtLg}
      baseJsonDocument={document}
      jsonSchema={schema}
    />
  );
};

const TabTasksContent: React.FC<{
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
          console.log("this id:", value);
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

const TabManifestContent: React.FC<{
  manifest: Manifest;
}> = ({ manifest }) => {
  return (
    <SchemaDefinedField
      className={spacing.mtLg}
      baseJsonDocument={manifest}
      isReadOnly
    />
  );
};
