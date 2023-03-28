import * as React from "react";
import { useHistory } from "react-router-dom";
import { AxiosError, AxiosResponse } from "axios";
import { useTranslation } from "react-i18next";
import WarningTriangleIcon from "@patternfly/react-icons/dist/esm/icons/warning-triangle-icon";
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

import keycloak from "@app/keycloak";
import {
  AppPlaceholder,
  AppTableWithControls,
  ConditionalRender,
  NoDataEmptyState,
  KebabDropdown,
  ToolbarBulkSelector,
} from "@app/shared/components";
import { Paths } from "@app/Paths";
import { Application, Task } from "@app/api/models";
import { getAxiosErrorMessage } from "@app/utils/utils";
import { ApplicationForm } from "../components/application-form";
import { ApplicationBusinessService } from "../components/application-business-service";
import { ImportApplicationsForm } from "../components/import-applications-form";
import { ApplicationAnalysisStatus } from "../components/application-analysis-status";
import { FilterToolbar } from "@app/shared/components/FilterToolbar";
import { AnalysisWizard } from "../analysis-wizard/analysis-wizard";
import { ApplicationIdentityForm } from "../components/application-identity-form/application-identity-form";
import { useCancelTaskMutation, useFetchTasks } from "@app/queries/tasks";
import {
  applicationsWriteScopes,
  importsWriteScopes,
  RBAC,
  RBAC_TYPE,
  tasksReadScopes,
  tasksWriteScopes,
} from "@app/rbac";
import { checkAccess } from "@app/common/rbac-utils";
import {
  useDeleteApplicationMutation,
  useFetchApplications,
  useBulkDeleteApplicationMutation,
} from "@app/queries/applications";
import {
  ApplicationTableType,
  useApplicationsFilterValues,
} from "../applicationsFilter";
import { ConditionalTooltip } from "@app/shared/components/ConditionalTooltip";
import { useEntityModal } from "@app/shared/hooks";
import { NotificationsContext } from "@app/shared/notifications-context";
import { ConfirmDialog } from "@app/shared/components/confirm-dialog/confirm-dialog";
import { ApplicationDetailDrawerAnalysis } from "../components/application-detail-drawer";
import { useQueryClient } from "@tanstack/react-query";

const ENTITY_FIELD = "entity";

const getRow = (rowData: IRowData): Application => {
  return rowData[ENTITY_FIELD];
};

export const ApplicationsTableAnalyze: React.FC = () => {
  //RBAC
  const token = keycloak.tokenParsed || undefined;

  const { t } = useTranslation();
  const { pushNotification } = React.useContext(NotificationsContext);

  const [isConfirmDialogOpen, setIsConfirmDialogOpen] =
    React.useState<Boolean>(false);

  const [applicationToDeleteId, setApplicationToDeleteId] =
    React.useState<number>();

  // Router
  const history = useHistory();

  const { applications, isFetching, fetchError, refetch } =
    useFetchApplications();

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
    openDetailDrawer,
    closeDetailDrawer,
    activeAppInDetailDrawer,
  } = useApplicationsFilterValues(applications, ApplicationTableType.Analysis);

  const { tasks } = useFetchTasks({ addon: "windup" });

  const queryClient = useQueryClient();
  const allTasksComplete = tasks.every((task) => task.state !== "Running");
  React.useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["applications"] });
  }, [allTasksComplete]);

  const completedCancelTask = () => {
    pushNotification({
      title: "Task",
      message: "Canceled",
      variant: "info",
    });
  };

  const failedCancelTask = () => {
    pushNotification({
      title: "Task",
      message: "Cancelation failed.",
      variant: "danger",
    });
  };

  const { mutate: cancelTask } = useCancelTaskMutation(
    completedCancelTask,
    failedCancelTask
  );

  const getTask = (application: Application) =>
    tasks.find((task: Task) => task.application?.id === application.id);

  const isTaskCancellable = (application: Application) => {
    const task = getTask(application);
    if (task?.state && task.state.match(/(Created|Running|Ready|Pending)/))
      return true;
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
    refetch();
  };

  const { mutate: deleteApplication } = useDeleteApplicationMutation(
    onDeleteApplicationSuccess,
    onDeleteApplicationError
  );

  const { mutate: bulkDeleteApplication } = useBulkDeleteApplicationMutation(
    onDeleteApplicationSuccess,
    onDeleteApplicationError
  );

  const [isAnalyzeModalOpen, setAnalyzeModalOpen] = React.useState(false);

  // Credentials modal
  const {
    isOpen: isCredentialsModalOpen,
    data: applicationToManageCredentials,
    update: openCredentialsModal,
    close: closeCredentialsModal,
  } = useEntityModal<Application[]>();

  // Bulk Delete modal
  const {
    isOpen: isBulkDeleteModalOpen,
    data: applicationToBulkDelete,
    update: openBulkDeleteModal,
    close: closeBulkDeleteModal,
  } = useEntityModal<Application[]>();

  // Application import modal
  const [isApplicationImportModalOpen, setIsApplicationImportModalOpen] =
    React.useState(false);

  // Table
  const columns: ICell[] = [
    {
      title: t("terms.name"),
      transforms: [sortable, cellWidth(20)],
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

  const rows: IRow[] = [];
  currentPageItems?.forEach((item) => {
    const isSelected = isRowSelected(item);

    rows.push({
      [ENTITY_FIELD]: item,
      selected: isSelected,
      isHoverable: true,
      isRowSelected: activeAppInDetailDrawer?.id === item.id,
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
  });

  const actionResolver = (rowData: IRowData): (IAction | ISeparator)[] => {
    const row: Application = getRow(rowData);
    if (!row) {
      return [];
    }

    const actions: (IAction | ISeparator)[] = [];
    const userScopes: string[] = token?.scope.split(" ") || [],
      applicationWriteAccess = checkAccess(userScopes, applicationsWriteScopes),
      tasksReadAccess = checkAccess(userScopes, tasksReadScopes),
      tasksWriteAccess = checkAccess(userScopes, tasksWriteScopes);

    if (applicationWriteAccess) {
      actions.push(
        {
          title: "Manage credentials",
          onClick: () => openCredentialsModal([row]),
        },
        {
          title: t("actions.delete"),
          onClick: () => deleteRow(row),
        }
      );
    }

    if (tasksReadAccess) {
      actions.push({
        title: t("actions.analysisDetails"),
        isDisabled: !getTask(row),
        onClick: () => {
          const task = getTask(row);
          if (task) window.open(`/hub/tasks/${task.id}`, "_blank");
        },
      });
    }

    if (tasksWriteAccess) {
      actions.push({
        title: "Cancel analysis",
        isDisabled: !isTaskCancellable(row),
        onClick: () => cancelAnalysis(row),
      });
    }

    return actions;
  };

  // Row actions
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
    setApplicationToDeleteId(row.id);
    setIsConfirmDialogOpen(true);
  };

  const cancelAnalysis = (row: Application) => {
    const task = tasks.find((task) => task.application?.id === row.id);
    if (task?.id) cancelTask(task.id);
  };

  const handleOnApplicationIdentityUpdated = () => {
    closeCredentialsModal();
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
  const applicationDropdownItems = applicationWriteAccess
    ? [
        <DropdownItem
          key="manage-applications-credentials"
          isDisabled={selectedRows.length < 1}
          onClick={() => {
            openCredentialsModal(selectedRows);
          }}
        >
          {t("actions.manageCredentials")}
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
  const dropdownItems = [
    ...importDropdownItems,
    ...applicationDropdownItems,
    ...applicationDeleteDropdown,
  ];

  const isAnalyzingAllowed = () => {
    const candidateTasks = selectedRows.filter(
      (app) =>
        !tasks.some(
          (task) =>
            task.application?.id === app.id &&
            task.state?.match(/(Created|Running|Ready|Pending)/)
        )
    );

    if (candidateTasks.length === selectedRows.length) return true;
    return false;
  };
  const hasExistingAnalysis = selectedRows.some((app) =>
    tasks.some((task) => task.application?.id === app.id)
  );
  return (
    <>
      <ConditionalRender
        when={isFetching && !(applications || fetchError)}
        then={<AppPlaceholder />}
      >
        <AppTableWithControls
          count={applications ? applications.length : 0}
          paginationProps={paginationProps}
          paginationIdPrefix="app-analysis"
          sortBy={sortBy}
          onSort={onSort}
          onSelect={selectRow}
          canSelectAll={false}
          cells={columns}
          rows={rows}
          actionResolver={actionResolver}
          isLoading={isFetching}
          loadingVariant="skeleton"
          fetchError={fetchError}
          onAppClick={openDetailDrawer}
          toolbarToggle={
            <FilterToolbar<Application>
              filterCategories={filterCategories}
              filterValues={filterValues}
              setFilterValues={setFilterValues}
              endToolbarItems={
                <ToolbarItem>{`${selectedRows.length} selected`}</ToolbarItem>
              }
            />
          }
          toolbarBulkSelector={
            <ToolbarBulkSelector
              onSelectAll={selectAll}
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
                  allowedPermissions={applicationsWriteScopes}
                  rbacType={RBAC_TYPE.Scope}
                >
                  <ToolbarItem>
                    <Button
                      type="button"
                      id="create-application"
                      aria-label="Create Application"
                      variant={ButtonVariant.primary}
                      onClick={openCreateApplicationModal}
                    >
                      {t("actions.createNew")}
                    </Button>
                  </ToolbarItem>
                </RBAC>
                <RBAC
                  allowedPermissions={tasksWriteScopes}
                  rbacType={RBAC_TYPE.Scope}
                >
                  <ToolbarItem>
                    <ConditionalTooltip
                      isTooltipEnabled={hasExistingAnalysis}
                      content={
                        "An analysis for one or more of the selected applications exists. This operation will overwrite pre-existing analysis data."
                      }
                    >
                      <Button
                        icon={
                          hasExistingAnalysis ? <WarningTriangleIcon /> : null
                        }
                        type="button"
                        id="analyze-application"
                        aria-label="Analyze Application"
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
                    </ConditionalTooltip>
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
        <ApplicationDetailDrawerAnalysis
          application={activeAppInDetailDrawer}
          applications={applications}
          onCloseClick={closeDetailDrawer}
          task={
            activeAppInDetailDrawer ? getTask(activeAppInDetailDrawer) : null
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
      {isConfirmDialogOpen && (
        <ConfirmDialog
          title={t("dialog.title.delete", {
            what: t("terms.application").toLowerCase(),
          })}
          isOpen={true}
          titleIconVariant={"warning"}
          message={t("dialog.message.delete")}
          confirmBtnVariant={ButtonVariant.danger}
          confirmBtnLabel={t("actions.delete")}
          cancelBtnLabel={t("actions.cancel")}
          onCancel={() => setIsConfirmDialogOpen(false)}
          onClose={() => setIsConfirmDialogOpen(false)}
          onConfirm={() => {
            if (applicationToDeleteId) {
              deleteApplication({ id: applicationToDeleteId });
              setApplicationToDeleteId(undefined);
            }
            setIsConfirmDialogOpen(false);
          }}
        />
      )}
    </>
  );
};
