import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import { AxiosError, AxiosResponse } from "axios";
import { useTranslation, Trans } from "react-i18next";
import { ApplicationAnalysisStatus } from "../components/application-analysis-status";
import {
  Button,
  ButtonVariant,
  DropdownItem,
  Modal,
  ToolbarGroup,
  ToolbarItem,
} from "@patternfly/react-core";
import {
  cellWidth,
  expandable,
  IAction,
  ICell,
  IExtraData,
  IRow,
  IRowData,
  ISeparator,
  sortable,
  TableText,
} from "@patternfly/react-table";
import TagIcon from "@patternfly/react-icons/dist/esm/icons/tag-icon";
import PencilAltIcon from "@patternfly/react-icons/dist/esm/icons/pencil-alt-icon";

import {
  AppPlaceholder,
  AppTableWithControls,
  ConditionalRender,
  NoDataEmptyState,
  KebabDropdown,
  ToolbarBulkSelector,
  ConfirmDialog,
} from "@app/shared/components";
import { ApplicationDependenciesFormContainer } from "@app/shared/containers";

import { Paths } from "@app/Paths";

import { Application, Task } from "@app/api/models";
import { getAxiosErrorMessage } from "@app/utils/utils";

import { ApplicationForm } from "../components/application-form";
import { RunAddonModal } from "@app/pages/addons/components/run-addon-form";

import { ApplicationListExpandedAreaAddons } from "../components/application-list-expanded-area/application-list-expanded-area-addons";
import { ImportApplicationsForm } from "../components/import-applications-form";
import {
  applicationsWriteScopes,
  dependenciesWriteScopes,
  importsWriteScopes,
  modifiedPathfinderWriteScopes,
  RBAC,
  RBAC_TYPE,
} from "@app/rbac";
import { checkAccess } from "@app/common/rbac-utils";
import keycloak from "@app/keycloak";
import {
  useBulkDeleteApplicationMutation,
  useDeleteApplicationMutation,
  useFetchApplications,
} from "@app/queries/applications";
import {
  ApplicationTableType,
  useApplicationsFilterValues,
} from "../applicationsFilter";
import { FilterToolbar } from "@app/shared/components/FilterToolbar/FilterToolbar";
import { useFetchAllTasks } from "@app/queries/tasks";
import { useFetchAddons } from "@app/queries/addons";
import { useQueryClient } from "react-query";
import { useEntityModal } from "@app/shared/hooks/useEntityModal";
import { NotificationsContext } from "@app/shared/notifications-context";

const ENTITY_FIELD = "entity";

const getRow = (rowData: IRowData): Application => {
  return rowData[ENTITY_FIELD];
};

export const ApplicationsTableAddons: React.FC = () => {
  //RBAC
  const token = keycloak.tokenParsed;
  // i18
  const { t } = useTranslation();

  const [
    isApplicationDeleteConfirmDialogOpen,
    setIsApplicationDeleteConfirmDialogOpen,
  ] = React.useState<Boolean>(false);

  const [applicationToDelete, setApplicationToDelete] =
    React.useState<number>();

  const { pushNotification } = React.useContext(NotificationsContext);

  // Router
  const history = useHistory();

  // Table data
  const { applications, isFetching, fetchError, refetch } =
    useFetchApplications();

  const queryClient = useQueryClient();

  const {
    paginationProps,
    sortBy,
    onSort,
    filterCategories,
    filterValues,
    setFilterValues,
    handleOnClearAllFilters,
    currentPageItems,
    isRowSelected,
    toggleRowSelected,
    selectAll,
    selectMultiple,
    areAllSelected,
    selectedRows,
    isRowExpanded,
    toggleRowExpanded,
    expandAll,
    areAllExpanded,
    setPageNumber,
  } = useApplicationsFilterValues(applications, ApplicationTableType.Addons);

  // Create and update modal
  const {
    isOpen: isApplicationModalOpen,
    data: applicationToUpdate,
    create: openCreateApplicationModal,
    update: openUpdateApplicationModal,
    close: closeApplicationModal,
  } = useEntityModal<Application>();

  // Here we want all tasks that don't belong to admin/windup
  const { tasks } = useFetchAllTasks({ notAddons: ["admin", "windup"] });
  const getTasksForApplication = (application: Application) => {
    const filteredTasks = tasks.filter((task: Task) => {
      return task.application?.id === application.id;
    });
    return filteredTasks.sort((a, b) => {
      if (a?.createTime && b?.createTime) {
        return a.createTime > b.createTime ? 1 : -1;
      }
      return 0;
    });
  };

  const { addons } = useFetchAddons({ includeBundled: false });

  const onApplicationModalSaved = (response: AxiosResponse<Application>) => {
    if (!applicationToUpdate) {
      pushNotification({
        title: t("toastr.success.added", {
          what: response.data.name,
          type: t("terms.application").toLowerCase(),
        }),
        variant: "success",
      });
    }

    closeApplicationModal();
    refetch();
  };

  // Delete
  const onDeleteApplicationSuccess = (appIDCount: number) => {
    pushNotification({
      title: t("toastr.success.applicationDeleted", {
        appIDCount: appIDCount,
      }),
      variant: "success",
    });
    refetch();
  };

  const onDeleteApplicationError = (error: AxiosError) => {
    pushNotification({
      title: getAxiosErrorMessage(error),
      variant: "danger",
    });
  };
  const [isOpen, setIsOpen] = useState(false);
  const onSelect = () => {
    setIsOpen((current) => !current);
  };

  const onToggle = (isOpen: boolean) => {
    setIsOpen(isOpen);
  };
  const options = [
    {
      key: "item1",
      name: "item1",
    },
  ];

  // Run addon modal
  const {
    isOpen: isRunModalOpen,
    data: applicationsToRun,
    update: openRunModal,
    close: closeRunModal,
  } = useEntityModal<Application[]>();

  // Dependencies modal
  const {
    isOpen: isDependenciesModalOpen,
    data: applicationToManageDependencies,
    update: openDependenciesModal,
    close: closeDependenciesModal,
  } = useEntityModal<Application>();

  // Application import modal
  const [isApplicationImportModalOpen, setIsApplicationImportModalOpen] =
    useState(false);

  // Bulk Delete modal
  const {
    isOpen: isBulkDeleteModalOpen,
    data: applicationToBulkDelete,
    update: openBulkDeleteModal,
    close: closeBulkDeleteModal,
  } = useEntityModal<Application[]>();

  const { mutate: deleteApplication } = useDeleteApplicationMutation(
    onDeleteApplicationSuccess,
    onDeleteApplicationError
  );

  const { mutate: bulkDeleteApplication } = useBulkDeleteApplicationMutation(
    onDeleteApplicationSuccess,
    onDeleteApplicationError
  );

  // Table
  const columns: ICell[] = [
    {
      title: t("terms.name"),
      transforms: [sortable, cellWidth(20)],
      cellFormatters: [expandable],
    },
    { title: t("terms.description"), transforms: [cellWidth(25)] },
    { title: t("terms.lastRun"), transforms: [cellWidth(10)] },
    { title: t("terms.tagCount"), transforms: [sortable, cellWidth(10)] },
    { title: "", props: { className: "pf-c-table__inline-edit-action" } },
  ];

  const rows: IRow[] = [];
  currentPageItems?.forEach((item) => {
    const isExpanded = isRowExpanded(item);
    const isSelected = isRowSelected(item);
    const appTasks = getTasksForApplication(item);

    const lastRunState = (application: Application) => {
      const t = getTasksForApplication(application);
      if (t.length === 0) return "No task";
      const task = t[0];
      if (task && task.state) return task.state;

      return "No task";
    };

    rows.push({
      [ENTITY_FIELD]: item,
      isOpen: isExpanded,
      selected: isSelected,
      cells: [
        {
          title: <TableText wrapModifier="truncate">{item.name}</TableText>,
        },
        {
          title: (
            <TableText wrapModifier="truncate">{item.description}</TableText>
          ),
        },
        {
          title: <ApplicationAnalysisStatus state={lastRunState(item)} />,
        },
        {
          title: (
            <>
              <TagIcon /> {item.tags ? item.tags.length : 0}
            </>
          ),
        },
        {
          title: (
            <div className="pf-c-inline-edit__action pf-m-enable-editable">
              <RBAC
                allowedPermissions={applicationsWriteScopes}
                rbacType={RBAC_TYPE.Scope}
              >
                <Button
                  type="button"
                  variant="plain"
                  onClick={() => openUpdateApplicationModal(item)}
                >
                  <PencilAltIcon />
                </Button>
              </RBAC>
            </div>
          ),
        },
      ],
    });

    rows.push({
      parent: rows.length - 1,
      fullWidth: false,
      cells: [
        <div className="pf-c-table__expandable-row-content">
          <ApplicationListExpandedAreaAddons
            application={item}
            tasks={appTasks}
          />
        </div>,
      ],
    });
  });

  const actionResolver = (rowData: IRowData): (IAction | ISeparator)[] => {
    const row: Application = getRow(rowData);
    if (!row) {
      return [];
    }

    const userScopes: string[] = token?.scope.split(" ") || [],
      dependenciesWriteAccess = checkAccess(
        userScopes,
        dependenciesWriteScopes
      ),
      applicationWriteAccess = checkAccess(userScopes, applicationsWriteScopes);

    const actions: (IAction | ISeparator)[] = [];
    if (applicationWriteAccess) {
      actions.push({
        title: t("actions.delete"),
        onClick: (
          event: React.MouseEvent,
          rowIndex: number,
          rowData: IRowData
        ) => {
          const row: Application = getRow(rowData);
          deleteRow(row);
        },
      });
    }

    if (dependenciesWriteAccess) {
      actions.push({
        title: t("actions.manageDependencies"),
        onClick: (
          event: React.MouseEvent,
          rowIndex: number,
          rowData: IRowData
        ) => {
          const row: Application = getRow(rowData);
          openDependenciesModal(row);
        },
      });
    }

    return actions;
  };

  // Row actions
  const collapseRow = (
    event: React.MouseEvent,
    rowIndex: number,
    isOpen: boolean,
    rowData: IRowData,
    extraData: IExtraData
  ) => {
    const row = getRow(rowData);
    toggleRowExpanded(row);
  };

  const selectRow = (
    event: React.FormEvent<HTMLInputElement>,
    isSelected: boolean,
    rowIndex: number,
    rowData: IRowData,
    extraData: IExtraData
  ) => {
    const row = getRow(rowData);
    toggleRowSelected(row);
  };

  const deleteRow = (row: Application) => {
    setApplicationToDelete(row.id);
    setIsApplicationDeleteConfirmDialogOpen(true);
  };

  const userScopes: string[] = token?.scope.split(" ") || [],
    importWriteAccess = checkAccess(userScopes, importsWriteScopes),
    applicationWriteAccess = checkAccess(userScopes, applicationsWriteScopes);

  const importDropdownItems = importWriteAccess
    ? [
        <DropdownItem
          key="import-applications"
          component="button"
          onClick={() => setIsApplicationImportModalOpen(true)}
        >
          {t("actions.import")}
        </DropdownItem>,
        <DropdownItem
          key="manage-import-applications"
          onClick={() => {
            history.push(Paths.applicationsImports);
          }}
        >
          {t("actions.manageImports")}
        </DropdownItem>,
      ]
    : [];
  const applicationDeleteDropdown = applicationWriteAccess
    ? [
        <DropdownItem
          key="manage-applications-bulk-delete"
          isDisabled={selectedRows.length < 1}
          onClick={() => {
            openBulkDeleteModal(selectedRows);
          }}
        >
          {t("actions.delete")}
        </DropdownItem>,
      ]
    : [];
  const dropdownItems = [...importDropdownItems, ...applicationDeleteDropdown];

  return (
    <>
      <ConditionalRender
        when={isFetching && !(applications || fetchError)}
        then={<AppPlaceholder />}
      >
        <AppTableWithControls
          paginationProps={paginationProps}
          paginationIdPrefix="app-addons"
          count={applications ? applications.length : 0}
          sortBy={sortBy}
          onSort={onSort}
          onCollapse={collapseRow}
          onSelect={selectRow}
          canSelectAll={false}
          cells={columns}
          rows={rows}
          actionResolver={actionResolver}
          isLoading={isFetching}
          loadingVariant="skeleton"
          fetchError={fetchError}
          toolbarToggle={
            <FilterToolbar<Application>
              filterCategories={filterCategories}
              filterValues={filterValues}
              setFilterValues={setFilterValues}
            />
          }
          toolbarBulkSelector={
            <ToolbarBulkSelector
              isExpandable={true}
              onExpandAll={expandAll}
              onSelectAll={selectAll}
              areAllExpanded={areAllExpanded}
              areAllSelected={areAllSelected}
              selectedRows={selectedRows}
              paginationProps={paginationProps}
              currentPageItems={currentPageItems}
              onSelectMultiple={selectMultiple}
            />
          }
          toolbarClearAllFilters={handleOnClearAllFilters}
          toolbarActions={
            <>
              <ToolbarGroup variant="button-group">
                <ToolbarItem>
                  <RBAC
                    allowedPermissions={applicationsWriteScopes}
                    rbacType={RBAC_TYPE.Scope}
                  >
                    <Button
                      type="button"
                      aria-label="create-application"
                      variant={ButtonVariant.primary}
                      onClick={openCreateApplicationModal}
                    >
                      {t("actions.createNew")}
                    </Button>
                  </RBAC>
                </ToolbarItem>
                <RBAC
                  allowedPermissions={modifiedPathfinderWriteScopes}
                  rbacType={RBAC_TYPE.Scope}
                >
                  <ToolbarItem>
                    <Button
                      type="button"
                      aria-label="run-application"
                      variant={ButtonVariant.primary}
                      onClick={() => openRunModal(selectedRows)}
                      isDisabled={selectedRows.length < 1}
                    >
                      {t("actions.run")}
                    </Button>
                  </ToolbarItem>
                </RBAC>
                {dropdownItems.length ? (
                  <ToolbarItem>
                    <KebabDropdown
                      dropdownItems={dropdownItems}
                    ></KebabDropdown>
                  </ToolbarItem>
                ) : (
                  <></>
                )}
              </ToolbarGroup>
            </>
          }
          noDataState={
            <NoDataEmptyState
              // t('terms.applications')
              title={t("composed.noDataStateTitle", {
                what: t("terms.applications").toLowerCase(),
              })}
              // t('terms.application')
              description={
                t("composed.noDataStateBody", {
                  what: t("terms.application").toLowerCase(),
                }) + "."
              }
            />
          }
        />
      </ConditionalRender>
      <Modal
        title={
          applicationToUpdate
            ? t("dialog.title.updateApplication")
            : t("dialog.title.newApplication")
        }
        variant="medium"
        isOpen={isApplicationModalOpen}
        onClose={closeApplicationModal}
      >
        <ApplicationForm
          application={applicationToUpdate}
          onSaved={onApplicationModalSaved}
          onCancel={closeApplicationModal}
        />
      </Modal>
      <Modal
        isOpen={isDependenciesModalOpen}
        variant="medium"
        title={t("composed.manageDependenciesFor", {
          what: applicationToManageDependencies?.name,
        })}
        onClose={closeDependenciesModal}
      >
        {applicationToManageDependencies && (
          <ApplicationDependenciesFormContainer
            application={applicationToManageDependencies}
            onCancel={closeDependenciesModal}
          />
        )}
      </Modal>
      <Modal
        isOpen={isApplicationImportModalOpen}
        variant="medium"
        title={t("dialog.title.importApplicationFile")}
        onClose={() => setIsApplicationImportModalOpen((current) => !current)}
      >
        <ImportApplicationsForm
          onSaved={() => {
            setIsApplicationImportModalOpen(false);
            refetch();
          }}
        />
      </Modal>
      <Modal
        isOpen={isBulkDeleteModalOpen}
        variant="small"
        title={t("dialog.title.delete", {
          what: t("terms.application(s)").toLowerCase(),
        })}
        titleIconVariant="warning"
        aria-label="Applications bulk delete"
        aria-describedby="applications-bulk-delete"
        onClose={() => closeBulkDeleteModal()}
        showClose={true}
        actions={[
          <Button
            key="delete"
            variant="danger"
            onClick={() => {
              let ids: number[] = [];
              if (applicationToBulkDelete) {
                applicationToBulkDelete?.forEach((application) => {
                  if (application.id) ids.push(application.id);
                });
                if (ids)
                  bulkDeleteApplication({
                    ids: ids,
                  });
              }
              closeBulkDeleteModal();
            }}
          >
            {t("actions.delete")}
          </Button>,
          <Button
            key="cancel"
            variant="link"
            onClick={() => closeBulkDeleteModal()}
          >
            {t("actions.cancel")}
          </Button>,
        ]}
      >
        {`${t("dialog.message.applicationsBulkDelete")} ${t(
          "dialog.message.delete"
        )}`}
      </Modal>
      <RunAddonModal
        applications={applicationsToRun}
        addons={addons}
        isOpen={isRunModalOpen}
        onSaved={closeRunModal}
        onCancel={closeRunModal}
      />
      {isApplicationDeleteConfirmDialogOpen && (
        <ConfirmDialog
          title={t("dialog.title.delete", {
            what: t("terms.application").toLowerCase(),
          })}
          titleIconVariant={"warning"}
          isOpen={true}
          message={t("dialog.message.delete")}
          confirmBtnVariant={ButtonVariant.danger}
          confirmBtnLabel={t("actions.delete")}
          cancelBtnLabel={t("actions.cancel")}
          onCancel={() => setIsApplicationDeleteConfirmDialogOpen(false)}
          onClose={() => setIsApplicationDeleteConfirmDialogOpen(false)}
          onConfirm={() => {
            if (applicationToDelete) {
              deleteApplication({ id: applicationToDelete });
              setApplicationToDelete(undefined);
            }
            setIsApplicationDeleteConfirmDialogOpen(false);
          }}
        />
      )}
    </>
  );
};
