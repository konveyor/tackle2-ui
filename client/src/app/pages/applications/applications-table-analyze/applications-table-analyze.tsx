import * as React from "react";
import { useHistory } from "react-router-dom";
import { AxiosError } from "axios";
import { useTranslation } from "react-i18next";
import WarningTriangleIcon from "@patternfly/react-icons/dist/esm/icons/warning-triangle-icon";
import {
  Button,
  ButtonVariant,
  Modal,
  ToolbarGroup,
  ToolbarItem,
  TooltipPosition,
} from "@patternfly/react-core";
import { DropdownItem } from "@patternfly/react-core/deprecated";
import {
  cellWidth,
  IAction,
  ICell,
  IExtraData,
  IRow,
  IRowData,
  ISeparator,
  nowrap,
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
  useFetchApplications,
  useBulkDeleteApplicationMutation,
  ApplicationsQueryKey,
} from "@app/queries/applications";
import {
  ApplicationTableType,
  useApplicationsFilterValues,
} from "../applicationsFilter";
import { ConditionalTooltip } from "@app/shared/components/ConditionalTooltip";
import { NotificationsContext } from "@app/shared/notifications-context";
import { ConfirmDialog } from "@app/shared/components/confirm-dialog/confirm-dialog";
import { ApplicationDetailDrawerAnalysis } from "../components/application-detail-drawer";
import { useQueryClient } from "@tanstack/react-query";
import { SimpleDocumentViewerModal } from "@app/shared/components/simple-task-viewer";
import { getTaskById } from "@app/api/rest";

const ENTITY_FIELD = "entity";

const getRow = (rowData: IRowData): Application => {
  return rowData[ENTITY_FIELD];
};

export const ApplicationsTableAnalyze: React.FC = () => {
  //RBAC
  const token = keycloak.tokenParsed || undefined;

  const { t } = useTranslation();
  const { pushNotification } = React.useContext(NotificationsContext);

  const [isAnalyzeModalOpen, setAnalyzeModalOpen] = React.useState(false);

  const [saveApplicationsModalState, setSaveApplicationsModalState] =
    React.useState<"create" | Application | null>(null);
  const isCreateUpdateApplicationsModalOpen =
    saveApplicationsModalState !== null;
  const createUpdateApplications =
    saveApplicationsModalState !== "create" ? saveApplicationsModalState : null;

  const [
    saveApplicationsCredentialsModalState,
    setSaveApplicationsCredentialsModalState,
  ] = React.useState<"create" | Application[] | null>(null);
  const isCreateUpdateCredentialsModalOpen =
    saveApplicationsCredentialsModalState !== null;
  const applicationsCredentialsToUpdate =
    saveApplicationsCredentialsModalState !== "create"
      ? saveApplicationsCredentialsModalState
      : null;

  const [applicationsToDelete, setApplicationsToDelete] = React.useState<
    Application[]
  >([]);

  const [isApplicationImportModalOpen, setIsApplicationImportModalOpen] =
    React.useState(false);

  const [taskToView, setTaskToView] = React.useState<{
    name: string;
    task: number | undefined;
  }>();

  // Router
  const history = useHistory();

  const {
    data: applications,
    isFetching,
    error: fetchError,
  } = useFetchApplications();

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
  } = useApplicationsFilterValues(ApplicationTableType.Analysis, applications);

  const { tasks } = useFetchTasks({ addon: "analyzer" });

  const queryClient = useQueryClient();
  const allTasksComplete = tasks.every((task) => task.state !== "Running");

  React.useEffect(() => {
    queryClient.invalidateQueries({ queryKey: [ApplicationsQueryKey] });
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

  // Delete

  const onDeleteApplicationSuccess = (appIDCount: number) => {
    pushNotification({
      title: t("toastr.success.applicationDeleted", {
        appIDCount: appIDCount,
      }),
      variant: "success",
    });
    activeAppInDetailDrawer && closeDetailDrawer();
    setApplicationsToDelete([]);
  };

  const onDeleteApplicationError = (error: AxiosError) => {
    pushNotification({
      title: getAxiosErrorMessage(error),
      variant: "danger",
    });
    setApplicationsToDelete([]);
  };

  const { mutate: bulkDeleteApplication } = useBulkDeleteApplicationMutation(
    onDeleteApplicationSuccess,
    onDeleteApplicationError
  );

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
    {
      title: t("terms.analysis"),
      transforms: [cellWidth(10)],
      cellTransforms: [nowrap],
    },
    {
      title: t("terms.tagCount"),
      transforms: [sortable, cellWidth(10)],
      cellTransforms: [nowrap],
    },
    {
      title: "",
      props: {
        className: "pf-v5-c-table__inline-edit-action",
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
      isClickable: true,
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
            <RBAC
              allowedPermissions={applicationsWriteScopes}
              rbacType={RBAC_TYPE.Scope}
            >
              <Button
                type="button"
                variant="plain"
                onClick={() => setSaveApplicationsModalState(item)}
              >
                <PencilAltIcon />
              </Button>
            </RBAC>
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
          onClick: () => setSaveApplicationsCredentialsModalState([row]),
        },
        {
          title: t("actions.delete"),
          ...(row.migrationWave !== null && {
            isAriaDisabled: true,
            tooltipProps: {
              position: TooltipPosition.top,
              content:
                "Cannot delete application assigned to a migration wave.",
            },
          }),
          onClick: () => setApplicationsToDelete([row]),
        }
      );
    }

    if (tasksReadAccess) {
      actions.push({
        title: t("actions.analysisDetails"),
        "aria-disabled": !getTask(row),
        onClick: () => {
          const task = getTask(row);
          if (task) setTaskToView({ name: row.name, task: task.id });
        },
      });
    }

    if (tasksWriteAccess) {
      actions.push({
        title: "Cancel analysis",
        "aria-disabled": !isTaskCancellable(row),
        onClick: () => cancelAnalysis(row),
      });
    }

    return actions;
  };

  // Row actions
  const selectRow = (
    _event: React.FormEvent<HTMLInputElement>,
    _isSelected: boolean,
    _rowIndex: number,
    rowData: IRowData,
    _extraData: IExtraData
  ) => {
    const row = getRow(rowData);
    toggleRowSelected(row);
  };

  const cancelAnalysis = (row: Application) => {
    const task = tasks.find((task) => task.application?.id === row.id);
    if (task?.id) cancelTask(task.id);
  };

  const userScopes: string[] = token?.scope.split(" ") || [],
    importWriteAccess = checkAccess(userScopes, importsWriteScopes),
    applicationWriteAccess = checkAccess(userScopes, applicationsWriteScopes);

  const areAppsInWaves = selectedRows.some(
    (application) => application.migrationWave !== null
  );

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
            setSaveApplicationsCredentialsModalState(selectedRows);
          }}
        >
          {t("actions.manageCredentials")}
        </DropdownItem>,
      ]
    : [];
  const applicationDeleteDropdown = applicationWriteAccess
    ? [
        <ConditionalTooltip
          key="delete-app-tooltip"
          isTooltipEnabled={areAppsInWaves}
          content={
            "Cannot delete application(s) assigned to migration wave(s)."
          }
        >
          <DropdownItem
            key="applications-bulk-delete"
            isAriaDisabled={areAppsInWaves || selectedRows.length < 1}
            onClick={() => {
              setApplicationsToDelete(selectedRows);
            }}
          >
            {t("actions.delete")}
          </DropdownItem>
        </ConditionalTooltip>,
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
          onAppClick={(application) => {
            if (activeAppInDetailDrawer === application) {
              closeDetailDrawer();
            } else {
              openDetailDrawer(application);
            }
          }}
          toolbarToggle={
            <FilterToolbar
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
                      onClick={() => {
                        setSaveApplicationsModalState("create");
                      }}
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
              description={t("composed.noDataStateBody", {
                what: t("terms.application").toLowerCase(),
              })}
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
        title={
          createUpdateApplications ? "Update application" : "New application"
        }
        variant="medium"
        isOpen={isCreateUpdateApplicationsModalOpen}
        onClose={() => setSaveApplicationsModalState(null)}
      >
        <ApplicationForm
          application={createUpdateApplications}
          onClose={() => setSaveApplicationsModalState(null)}
        />
      </Modal>{" "}
      <AnalysisWizard
        applications={selectedRows}
        isOpen={isAnalyzeModalOpen}
        onClose={() => {
          setAnalyzeModalOpen(false);
        }}
      />
      <Modal
        isOpen={isApplicationImportModalOpen}
        variant="medium"
        title={t("dialog.title.importApplicationFile")}
        onClose={() => setIsApplicationImportModalOpen(false)}
      >
        <ImportApplicationsForm
          onSaved={() => {
            setIsApplicationImportModalOpen(false);
            selectAll(false);
          }}
        />
      </Modal>
      <Modal
        isOpen={isCreateUpdateCredentialsModalOpen}
        variant="medium"
        title="Manage credentials"
        onClose={() => setSaveApplicationsCredentialsModalState(null)}
      >
        {applicationsCredentialsToUpdate && (
          <ApplicationIdentityForm
            applications={applicationsCredentialsToUpdate}
            onClose={() => setSaveApplicationsCredentialsModalState(null)}
          />
        )}
      </Modal>
      <ConfirmDialog
        title={t("dialog.title.delete", {
          what:
            applicationsToDelete.length > 1
              ? t("terms.application(s)").toLowerCase()
              : t("terms.application").toLowerCase(),
        })}
        titleIconVariant={"warning"}
        isOpen={applicationsToDelete.length > 0}
        message={`${t("dialog.message.applicationsBulkDelete")} ${t(
          "dialog.message.delete"
        )}`}
        aria-label="Applications bulk delete"
        confirmBtnVariant={ButtonVariant.danger}
        confirmBtnLabel={t("actions.delete")}
        cancelBtnLabel={t("actions.cancel")}
        onCancel={() => setApplicationsToDelete([])}
        onClose={() => setApplicationsToDelete([])}
        onConfirm={() => {
          const ids = applicationsToDelete
            .filter((application) => application.id)
            .map((application) => application.id);
          if (ids) bulkDeleteApplication({ ids: ids });
        }}
      />
      <SimpleDocumentViewerModal<Task | string>
        title={`Analysis details for ${taskToView?.name}`}
        fetch={getTaskById}
        documentId={taskToView?.task}
        onClose={() => setTaskToView(undefined)}
      />
    </>
  );
};
