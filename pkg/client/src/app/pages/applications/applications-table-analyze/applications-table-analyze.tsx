import * as React from "react";
import { Link, Redirect, useHistory } from "react-router-dom";
import { AxiosError, AxiosResponse } from "axios";
import { useTranslation } from "react-i18next";
import { useSelectionState } from "@konveyor/lib-ui";
import {
  Button,
  ButtonVariant,
  DropdownItem,
  Modal,
  Pagination,
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
import { TagIcon } from "@patternfly/react-icons/dist/esm/icons/tag-icon";
import { PencilAltIcon } from "@patternfly/react-icons/dist/esm/icons/pencil-alt-icon";
import { useDispatch } from "react-redux";
import keycloak from "@app/keycloak";

import { alertActions } from "@app/store/alert";
import { confirmDialogActions } from "@app/store/confirmDialog";
import {
  AppPlaceholder,
  AppTableWithControls,
  ConditionalRender,
  NoDataEmptyState,
  KebabDropdown,
  ToolbarBulkSelector,
} from "@app/shared/components";
import { useEntityModal } from "@app/shared/hooks";
import { ApplicationDependenciesFormContainer } from "@app/shared/containers";
import { Paths } from "@app/Paths";
import { Application, Task } from "@app/api/models";
import { getAxiosErrorMessage } from "@app/utils/utils";
import { ApplicationForm } from "../components/application-form";
import { ApplicationBusinessService } from "../components/application-business-service";
import { ImportApplicationsForm } from "../components/import-applications-form";
import { ApplicationListExpandedAreaAnalysis } from "../components/application-list-expanded-area/application-list-expanded-area-analysis";
import { ApplicationAnalysisStatus } from "../components/application-analysis-status";
import { FilterToolbar } from "@app/shared/components/FilterToolbar";
import { AnalysisWizard } from "../analysis-wizard/analysis-wizard";
import { ApplicationIdentityForm } from "../components/application-identity-form/application-identity-form";
import { useDeleteTaskMutation, useFetchTasks } from "@app/queries/tasks";
import { RBAC, RBAC_TYPE, taskWriteScopes, writeScopes } from "@app/rbac";
import { checkAccess } from "@app/common/rbac-utils";
import {
  useDeleteApplicationMutation,
  useFetchApplications,
} from "@app/queries/applications";
import {
  ApplicationTableType,
  getApplicationsFilterValues,
} from "../applicationsFilter";

const ENTITY_FIELD = "entity";

const getRow = (rowData: IRowData): Application => {
  return rowData[ENTITY_FIELD];
};

export const ApplicationsTableAnalyze: React.FC = () => {
  //RBAC
  const token = keycloak.tokenParsed || undefined;

  // i18
  const { t } = useTranslation();

  // Redux
  const dispatch = useDispatch();

  // Router
  const history = useHistory();

  const { applications, isFetching, fetchError } = useFetchApplications();

  const {
    paginationProps,
    sortBy,
    onSort,
    filterCategories,
    filterValues,
    setFilterValues,
    handleOnClearAllFilters,
    currentPageItems,
  } = getApplicationsFilterValues(applications, ApplicationTableType.Analysis);

  const { tasks } = useFetchTasks();

  const completedDeleteTask = () => {
    dispatch(alertActions.addInfo("Task", "Deleted"));
  };

  const failedDeleteTask = () => {
    dispatch(alertActions.addDanger("Task", "Deletion failed."));
  };

  const { mutate: deleteTask } = useDeleteTaskMutation(
    completedDeleteTask,
    failedDeleteTask
  );

  const getTask = (application: Application) =>
    tasks.find((task: Task) => task.application?.id === application.id);

  const isTaskCancellable = (application: Application) => {
    const task = getTask(application);
    if (task?.state && task.state.match(/(Created|Running|Ready)/)) return true;
    return false;
  };

  // Create and update modal
  const {
    isOpen: isApplicationModalOpen,
    data: applicationToUpdate,
    create: openCreateApplicationModal,
    update: openUpdateApplicationModal,
    close: closeApplicationModal,
  } = useEntityModal<Application>();

  const onApplicationModalSaved = (response: AxiosResponse<Application>) => {
    if (!applicationToUpdate) {
      dispatch(
        alertActions.addSuccess(
          t("toastr.success.added", {
            what: response.data.name,
            type: t("terms.application").toLowerCase(),
          })
        )
      );
    }

    closeApplicationModal();
  };

  // Delete

  const onDeleteApplicationSuccess = () => {
    dispatch(confirmDialogActions.processing());
    dispatch(confirmDialogActions.closeDialog());
  };

  const onDeleteApplicationError = (error: AxiosError) => {
    dispatch(confirmDialogActions.closeDialog());
    dispatch(alertActions.addDanger(getAxiosErrorMessage(error)));
  };
  const { mutate: deleteApplication } = useDeleteApplicationMutation(
    onDeleteApplicationSuccess,
    onDeleteApplicationError
  );

  const [isAnalyzeModalOpen, setAnalyzeModalOpen] = React.useState(false);

  // Dependencies modal
  const {
    isOpen: isDependenciesModalOpen,
    data: applicationToManageDependencies,
    update: openDependenciesModal,
    close: closeDependenciesModal,
  } = useEntityModal<Application>();

  // Credentials modal
  const {
    isOpen: isCredentialsModalOpen,
    data: applicationToManageCredentials,
    update: openCredentialsModal,
    close: closeCredentialsModal,
  } = useEntityModal<Application[]>();

  // Application import modal
  const [isApplicationImportModalOpen, setIsApplicationImportModalOpen] =
    React.useState(false);

  // Table
  const columns: ICell[] = [
    {
      title: t("terms.name"),
      transforms: [sortable, cellWidth(20)],
      cellFormatters: [expandable],
    },
    { title: t("terms.description"), transforms: [cellWidth(25)] },
    {
      title: t("terms.businessService"),
      transforms: [sortable, cellWidth(20)],
    },
    { title: t("terms.analysis"), transforms: [cellWidth(10)] },
    { title: t("terms.tagCount"), transforms: [sortable, cellWidth(10)] },
    {
      title: "",
      props: {
        className: "pf-c-table__inline-edit-action",
      },
    },
  ];

  const getTaskState = (application: Application) => {
    const task = getTask(application);
    if (task && task.state) return task.state;
    return "No task";
  };

  // Expand, select rows
  const {
    isItemSelected: isRowExpanded,
    toggleItemSelected: toggleRowExpanded,
    selectAll: expandAll,
    areAllSelected: areAllExpanded,
  } = useSelectionState<Application>({
    items: applications || [],
    isEqual: (a, b) => a.id === b.id,
  });

  //Bulk selection
  const {
    isItemSelected: isRowSelected,
    toggleItemSelected: toggleRowSelected,
    selectAll,
    selectMultiple,
    areAllSelected,
    selectedItems: selectedRows,
  } = useSelectionState<Application>({
    items: applications || [],
    isEqual: (a, b) => a.id === b.id,
  });

  //

  const rows: IRow[] = [];
  currentPageItems?.forEach((item) => {
    const isExpanded = isRowExpanded(item);
    const isSelected = isRowSelected(item);

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
          title: (
            <TableText wrapModifier="truncate">
              {item.businessService && (
                <ApplicationBusinessService id={item.businessService.id} />
              )}
            </TableText>
          ),
        },
        {
          title: (
            <>
              {item.id && (
                <ApplicationAnalysisStatus state={getTaskState(item)} />
              )}
            </>
          ),
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
              <RBAC allowedPermissions={writeScopes} rbacType={RBAC_TYPE.Scope}>
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
          <ApplicationListExpandedAreaAnalysis
            application={item}
            task={getTask(item)}
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

    const actions: (IAction | ISeparator)[] = [];
    const userScopes: string[] = token?.scope.split(" "),
      access = userScopes && checkAccess(userScopes, writeScopes);
    if (access) {
      actions.push(
        {
          title: t("actions.manageDependencies"),
          onClick: () => openDependenciesModal(row),
        },
        {
          title: "Manage credentials",
          onClick: () => openCredentialsModal([row]),
        },
        {
          title: t("actions.analysisDetails"),
          isDisabled: !getTask(row),
          onClick: () => {
            const task = getTask(row);
            if (task) window.open(`/hub/tasks/${task.id}`, "_blank");
          },
        },
        {
          title: "Cancel analysis",
          isDisabled: !isTaskCancellable(row),
          onClick: () => cancelAnalysis(row),
        },
        {
          title: t("actions.delete"),
          onClick: () => deleteRow(row),
        }
      );
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
    dispatch(
      confirmDialogActions.openDialog({
        title: t("dialog.title.delete", {
          what: t("terms.application").toLowerCase(),
        }),
        titleIconVariant: "warning",
        message: t("dialog.message.delete"),
        confirmBtnVariant: ButtonVariant.danger,
        confirmBtnLabel: t("actions.delete"),
        cancelBtnLabel: t("actions.cancel"),
        onConfirm: () => {
          deleteApplication(row?.id || 0);
        },
      })
    );
  };

  const cancelAnalysis = (row: Application) => {
    const task = tasks.find((task) => task.application?.id === row.id);
    if (task?.id) deleteTask(task.id);
  };

  const handleOnApplicationIdentityUpdated = () => {
    closeCredentialsModal();
  };

  const isAnalyzingAllowed = () => {
    const candidateTasks = selectedRows.filter(
      (app) =>
        !tasks.some(
          (task) =>
            task.application?.id === app.id &&
            task.state?.match(/(Created|Running|Ready)/)
        )
    );

    if (candidateTasks.length === selectedRows.length) return true;
    return false;
  };

  return (
    <>
      <ConditionalRender
        when={isFetching && !(applications || fetchError)}
        then={<AppPlaceholder />}
      >
        <AppTableWithControls
          count={applications ? applications.length : 0}
          paginationProps={paginationProps}
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
              endToolbarItems={
                <ToolbarItem>{`${selectedRows.length} selected`}</ToolbarItem>
              }
              beginToolbarItems={<></>}
              pagination={
                <Pagination
                  isCompact
                  {...paginationProps}
                  widgetId="vms-table-pagination-top"
                />
              }
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
                <RBAC
                  allowedPermissions={writeScopes}
                  rbacType={RBAC_TYPE.Scope}
                >
                  <ToolbarItem>
                    <Button
                      type="button"
                      aria-label="create-application"
                      variant={ButtonVariant.primary}
                      onClick={openCreateApplicationModal}
                    >
                      {t("actions.createNew")}
                    </Button>
                  </ToolbarItem>
                </RBAC>
                <RBAC
                  allowedPermissions={taskWriteScopes}
                  rbacType={RBAC_TYPE.Scope}
                >
                  <ToolbarItem>
                    <Button
                      type="button"
                      aria-label="analyze-application"
                      variant={ButtonVariant.primary}
                      onClick={() => {
                        setAnalyzeModalOpen(true);
                      }}
                      isDisabled={
                        selectedRows.length < 1 || !isAnalyzingAllowed()
                      }
                    >
                      {t("actions.analyze")}
                    </Button>
                  </ToolbarItem>
                </RBAC>
                <RBAC
                  key="import-applications"
                  allowedPermissions={writeScopes}
                  rbacType={RBAC_TYPE.Scope}
                >
                  <ToolbarItem>
                    <KebabDropdown
                      dropdownItems={[
                        <DropdownItem
                          key="import"
                          component="button"
                          onClick={() => setIsApplicationImportModalOpen(true)}
                        >
                          {t("actions.import")}
                        </DropdownItem>,
                        <DropdownItem
                          key="manage-imports"
                          onClick={() => {
                            history.push(Paths.applicationsImports);
                          }}
                        >
                          {t("actions.manageImports")}
                        </DropdownItem>,
                        <DropdownItem
                          key="manage-creds"
                          isDisabled={selectedRows.length < 1}
                          onClick={() => openCredentialsModal(selectedRows)}
                        >
                          {t("actions.manageCredentials")}
                        </DropdownItem>,
                      ]}
                    />
                  </ToolbarItem>
                </RBAC>
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
        title={applicationToUpdate ? "Update application" : "New application"}
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

      {isAnalyzeModalOpen && (
        <AnalysisWizard
          applications={selectedRows}
          isOpen={isAnalyzeModalOpen}
          onClose={() => {
            setAnalyzeModalOpen(false);
          }}
        />
      )}

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
          }}
        />
      </Modal>

      <Modal
        isOpen={isCredentialsModalOpen}
        variant="medium"
        title="Manage credentials"
        onClose={closeCredentialsModal}
      >
        {applicationToManageCredentials && (
          <ApplicationIdentityForm
            applications={applicationToManageCredentials}
            onSaved={handleOnApplicationIdentityUpdated}
            onCancel={closeCredentialsModal}
          />
        )}
      </Modal>
    </>
  );
};
