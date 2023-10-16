// External libraries
import * as React from "react";
import { useState } from "react";
import { AxiosError } from "axios";
import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";

// @patternfly
import {
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  Button,
  ToolbarGroup,
  ButtonVariant,
  DropdownItem,
  Dropdown,
  MenuToggle,
  MenuToggleElement,
  Modal,
  DropdownList,
} from "@patternfly/react-core";
import {
  PencilAltIcon,
  TagIcon,
  EllipsisVIcon,
  WarningTriangleIcon,
} from "@patternfly/react-icons";
import { Table, Thead, Tr, Th, Td, Tbody } from "@patternfly/react-table";

// @app components and utilities
import { AppPlaceholder } from "@app/components/AppPlaceholder";
import {
  FilterType,
  FilterToolbar,
} from "@app/components/FilterToolbar/FilterToolbar";
import { SimplePagination } from "@app/components/SimplePagination";
import {
  TableHeaderContentWithControls,
  ConditionalTableBody,
  TableRowContentWithControls,
} from "@app/components/TableControls";
import { ToolbarBulkSelector } from "@app/components/ToolbarBulkSelector";
import { SimpleDocumentViewerModal } from "@app/components/SimpleDocumentViewer";
import { getTaskById } from "@app/api/rest";
import { ConfirmDialog } from "@app/components/ConfirmDialog";
import { NotificationsContext } from "@app/components/NotificationsContext";
import { dedupeFunction, getAxiosErrorMessage } from "@app/utils/utils";
import { Paths } from "@app/Paths";
import keycloak from "@app/keycloak";
import {
  RBAC,
  RBAC_TYPE,
  applicationsWriteScopes,
  tasksWriteScopes,
  importsWriteScopes,
  tasksReadScopes,
} from "@app/rbac";
import { checkAccess } from "@app/utils/rbac-utils";

// Hooks
import { useLocalTableControls } from "@app/hooks/table-controls";

// Queries
import { Application, Task } from "@app/api/models";
import {
  useBulkDeleteApplicationMutation,
  useFetchApplications,
} from "@app/queries/applications";
import { useCancelTaskMutation, useFetchTasks } from "@app/queries/tasks";
import { useFetchReviews } from "@app/queries/reviews";
import { useFetchIdentities } from "@app/queries/identities";
import { useFetchTagCategories } from "@app/queries/tags";

// Relative components
import { ApplicationBusinessService } from "../components/application-business-service";
import { ApplicationDetailDrawerAnalysis } from "../components/application-detail-drawer";
import { ApplicationForm } from "../components/application-form";
import { ApplicationIdentityForm } from "../components/application-identity-form/application-identity-form";
import { ImportApplicationsForm } from "../components/import-applications-form";
import { ConditionalRender } from "@app/components/ConditionalRender";
import { NoDataEmptyState } from "@app/components/NoDataEmptyState";
import { ConditionalTooltip } from "@app/components/ConditionalTooltip";
import { TaskGroupProvider } from "../analysis-wizard/components/TaskGroupContext";
import { AnalysisWizard } from "../analysis-wizard/analysis-wizard";
import { ApplicationAnalysisStatus } from "../components/application-analysis-status";

export const ApplicationsTableAnalyze: React.FC = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const token = keycloak.tokenParsed;

  const { pushNotification } = React.useContext(NotificationsContext);

  const [isToolbarKebabOpen, setIsToolbarKebabOpen] =
    React.useState<boolean>(false);
  const [isRowDropdownOpen, setIsRowDropdownOpen] = React.useState<
    number | null
  >(null);

  const [saveApplicationModalState, setSaveApplicationModalState] =
    React.useState<"create" | Application | null>(null);

  const isCreateUpdateApplicationsModalOpen =
    saveApplicationModalState !== null;

  const createUpdateApplications =
    saveApplicationModalState !== "create" ? saveApplicationModalState : null;

  const [isAnalyzeModalOpen, setAnalyzeModalOpen] = useState(false);

  const [applicationsToDelete, setApplicationsToDelete] = useState<
    Application[]
  >([]);

  const getTask = (application: Application) =>
    tasks.find((task: Task) => task.application?.id === application.id);

  const { tasks } = useFetchTasks({ addon: "analyzer" });

  const { tagCategories: tagCategories } = useFetchTagCategories();

  const { identities } = useFetchIdentities();

  const {
    data: applications,
    isFetching: isFetchingApplications,
    error: applicationsFetchError,
    refetch: fetchApplications,
  } = useFetchApplications();

  const onDeleteApplicationSuccess = (appIDCount: number) => {
    pushNotification({
      title: t("toastr.success.applicationDeleted", {
        appIDCount: appIDCount,
      }),
      variant: "success",
    });
    clearActiveItem();
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

  const isTaskCancellable = (application: Application) => {
    const task = getTask(application);
    if (task?.state && task.state.match(/(Created|Running|Ready|Pending)/))
      return true;
    return false;
  };

  const cancelAnalysis = (row: Application) => {
    const task = tasks.find((task) => task.application?.id === row.id);
    if (task?.id) cancelTask(task.id);
  };

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

  const tableControls = useLocalTableControls({
    idProperty: "id",
    items: applications || [],
    columnNames: {
      name: "Name",
      description: "Description",
      businessService: "Business Service",
      analysis: "Analysis",
      tags: "Tags",
    },
    isFilterEnabled: true,
    isSortEnabled: true,
    isPaginationEnabled: true,
    isSelectionEnabled: true,
    isActiveItemEnabled: true,
    sortableColumns: ["name", "description", "businessService", "tags"],
    initialSort: { columnKey: "name", direction: "asc" },
    getSortValues: (app) => ({
      name: app.name,
      description: app.description || "",
      businessService: app.businessService?.name || "",
      tags: app.tags?.length || 0,
    }),
    filterCategories: [
      {
        key: "name",
        title: t("terms.name"),
        type: FilterType.search,
        placeholderText:
          t("actions.filterBy", {
            what: t("terms.name").toLowerCase(),
          }) + "...",
        getItemValue: (item) => item?.name || "",
      },
      {
        key: "description",
        title: t("terms.description"),
        type: FilterType.search,
        placeholderText:
          t("actions.filterBy", {
            what: t("terms.description").toLowerCase(),
          }) + "...",
        getItemValue: (item) => item.description || "",
      },
      {
        key: "businessService",
        title: t("terms.businessService"),
        placeholderText:
          t("actions.filterBy", {
            what: t("terms.businessService").toLowerCase(),
          }) + "...",
        type: FilterType.select,
        selectOptions: dedupeFunction(
          applications
            .filter((app) => !!app.businessService?.name)
            .map((app) => app.businessService?.name)
            .map((name) => ({ key: name, value: name }))
        ),
        getItemValue: (item) => item.businessService?.name || "",
      },
      {
        key: "identities",
        title: t("terms.credentialType"),
        placeholderText:
          t("actions.filterBy", {
            what: t("terms.credentialType").toLowerCase(),
          }) + "...",
        type: FilterType.multiselect,
        selectOptions: [
          { key: "source", value: "Source" },
          { key: "maven", value: "Maven" },
          { key: "proxy", value: "Proxy" },
        ],
        getItemValue: (item) => {
          const searchStringArr: string[] = [];
          item.identities?.forEach((appIdentity) => {
            const matchingIdentity = identities.find(
              (identity) => identity.id === appIdentity.id
            );
            searchStringArr.push(matchingIdentity?.kind || "");
          });
          const searchString = searchStringArr.join("");
          return searchString;
        },
      },
      {
        key: "repository",
        title: t("terms.repositoryType"),
        placeholderText:
          t("actions.filterBy", {
            what: t("terms.repositoryType").toLowerCase(),
          }) + "...",
        type: FilterType.select,
        selectOptions: [
          { key: "git", value: "Git" },
          { key: "subversion", value: "Subversion" },
        ],
        getItemValue: (item) => item?.repository?.kind || "",
      },
      {
        key: "binary",
        title: t("terms.artifact"),
        placeholderText:
          t("actions.filterBy", {
            what: t("terms.artifact").toLowerCase(),
          }) + "...",
        type: FilterType.select,
        selectOptions: [
          { key: "binary", value: t("terms.artifactAssociated") },
          { key: "none", value: t("terms.artifactNotAssociated") },
        ],
        getItemValue: (item) => {
          const hasBinary =
            item.binary !== "::" && item.binary?.match(/.+:.+:.+/)
              ? "binary"
              : "none";

          return hasBinary;
        },
      },
      {
        key: "tags",
        title: t("terms.tags"),
        type: FilterType.multiselect,
        placeholderText:
          t("actions.filterBy", {
            what: t("terms.tagName").toLowerCase(),
          }) + "...",
        getItemValue: (item) => {
          const tagNames = item?.tags?.map((tag) => tag.name).join("");
          return tagNames || "";
        },
        selectOptions: dedupeFunction(
          tagCategories
            ?.map((tagCategory) => tagCategory?.tags)
            .flat()
            .filter((tag) => tag && tag.name)
            .map((tag) => ({ key: tag?.name, value: tag?.name }))
        ),
      },
    ],
    initialItemsPerPage: 10,
    hasActionsColumn: true,
  });

  const {
    currentPageItems,
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
      toolbarBulkSelectorProps,
    },
    activeItemDerivedState: { activeItem, clearActiveItem },

    selectionState: { selectedItems: selectedRows },
  } = tableControls;

  const { reviews } = useFetchReviews();

  const [
    saveApplicationsCredentialsModalState,
    setSaveApplicationsCredentialsModalState,
  ] = useState<"create" | Application[] | null>(null);
  const isCreateUpdateCredentialsModalOpen =
    saveApplicationsCredentialsModalState !== null;
  const applicationsCredentialsToUpdate =
    saveApplicationsCredentialsModalState !== "create"
      ? saveApplicationsCredentialsModalState
      : null;

  const [isApplicationImportModalOpen, setIsApplicationImportModalOpen] =
    useState(false);

  const [taskToView, setTaskToView] = useState<{
    name: string;
    task: number | undefined;
  }>();

  const userScopes: string[] = token?.scope.split(" ") || [],
    importWriteAccess = checkAccess(userScopes, importsWriteScopes),
    applicationWriteAccess = checkAccess(userScopes, applicationsWriteScopes),
    tasksReadAccess = checkAccess(userScopes, tasksReadScopes),
    tasksWriteAccess = checkAccess(userScopes, tasksWriteScopes);

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
    <ConditionalRender
      when={isFetchingApplications && !(applications || applicationsFetchError)}
      then={<AppPlaceholder />}
    >
      <div
        style={{
          backgroundColor: "var(--pf-v5-global--BackgroundColor--100)",
        }}
      >
        <Toolbar {...toolbarProps}>
          <ToolbarContent>
            <ToolbarBulkSelector {...toolbarBulkSelectorProps} />
            <FilterToolbar {...filterToolbarProps} />
            <ToolbarGroup variant="button-group">
              <ToolbarItem>
                <RBAC
                  allowedPermissions={applicationsWriteScopes}
                  rbacType={RBAC_TYPE.Scope}
                >
                  <Button
                    type="button"
                    id="create-application"
                    aria-label="Create Application"
                    variant={ButtonVariant.primary}
                    onClick={() => {
                      setSaveApplicationModalState("create");
                    }}
                  >
                    {t("actions.createNew")}
                  </Button>
                </RBAC>
              </ToolbarItem>
              <ToolbarItem>
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
              </ToolbarItem>
              {dropdownItems.length ? (
                <ToolbarItem id="toolbar-kebab">
                  <Dropdown
                    isOpen={isToolbarKebabOpen}
                    onSelect={() => setIsToolbarKebabOpen(false)}
                    onOpenChange={(_isOpen) => setIsToolbarKebabOpen(false)}
                    toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                      <MenuToggle
                        ref={toggleRef}
                        aria-label="kebab dropdown toggle"
                        variant="plain"
                        onClick={() =>
                          setIsToolbarKebabOpen(!isToolbarKebabOpen)
                        }
                        isExpanded={isToolbarKebabOpen}
                      >
                        <EllipsisVIcon />
                      </MenuToggle>
                    )}
                    shouldFocusToggleOnSelect
                  >
                    {dropdownItems}
                  </Dropdown>
                </ToolbarItem>
              ) : (
                <></>
              )}
            </ToolbarGroup>

            <ToolbarItem {...paginationToolbarItemProps}>
              <SimplePagination
                idPrefix="app-analysis-table"
                isTop
                paginationProps={paginationProps}
              />
            </ToolbarItem>
          </ToolbarContent>
        </Toolbar>
        <Table {...tableProps} aria-label="App analysis table">
          <Thead>
            <Tr>
              <TableHeaderContentWithControls {...tableControls}>
                <Th {...getThProps({ columnKey: "name" })} />
                <Th {...getThProps({ columnKey: "description" })} />
                <Th {...getThProps({ columnKey: "businessService" })} />
                <Th {...getThProps({ columnKey: "analysis" })} />
                <Th {...getThProps({ columnKey: "tags" })} />
                <Th />
              </TableHeaderContentWithControls>
            </Tr>
          </Thead>
          <ConditionalTableBody
            isError={!!applicationsFetchError}
            isNoData={currentPageItems.length === 0}
            noDataEmptyState={
              <NoDataEmptyState
                title={t("composed.noDataStateTitle", {
                  what: t("terms.applications").toLowerCase(),
                })}
                description={t("composed.noDataStateBody", {
                  what: t("terms.application").toLowerCase(),
                })}
              />
            }
            numRenderedColumns={numRenderedColumns}
          >
            <Tbody>
              {currentPageItems.map((application, rowIndex) => (
                <Tr key={application.id} {...getTrProps({ item: application })}>
                  <TableRowContentWithControls
                    {...tableControls}
                    item={application}
                    rowIndex={rowIndex}
                  >
                    <Td
                      width={20}
                      {...getTdProps({ columnKey: "name" })}
                      modifier="truncate"
                    >
                      {application.name}
                    </Td>
                    <Td
                      width={25}
                      {...getTdProps({ columnKey: "description" })}
                      modifier="truncate"
                    >
                      {application.description}
                    </Td>
                    <Td
                      width={10}
                      modifier="truncate"
                      {...getTdProps({ columnKey: "businessService" })}
                    >
                      {application.businessService && (
                        <ApplicationBusinessService
                          id={application.businessService.id}
                        />
                      )}
                    </Td>
                    <Td
                      width={10}
                      modifier="truncate"
                      {...getTdProps({ columnKey: "analysis" })}
                    >
                      <ApplicationAnalysisStatus
                        state={getTask(application)?.state || "No task"}
                      />
                    </Td>
                    <Td
                      width={10}
                      modifier="truncate"
                      {...getTdProps({ columnKey: "tags" })}
                    >
                      <TagIcon />
                      {application.tags ? application.tags.length : 0}
                    </Td>
                    <Td isActionCell id="pencil-action">
                      <Button
                        variant="plain"
                        icon={<PencilAltIcon />}
                        onClick={() =>
                          setSaveApplicationModalState(application)
                        }
                      />
                    </Td>
                    <Td isActionCell id="row-actions">
                      <Dropdown
                        isOpen={isRowDropdownOpen === application.id}
                        onSelect={() => setIsRowDropdownOpen(null)}
                        onOpenChange={(_isOpen) => setIsRowDropdownOpen(null)}
                        popperProps={{ position: "right" }}
                        toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                          <MenuToggle
                            ref={toggleRef}
                            aria-label="row actions dropdown toggle"
                            variant="plain"
                            onClick={() => {
                              isRowDropdownOpen
                                ? setIsRowDropdownOpen(null)
                                : setIsRowDropdownOpen(application.id);
                            }}
                            isExpanded={isRowDropdownOpen === rowIndex}
                          >
                            <EllipsisVIcon />
                          </MenuToggle>
                        )}
                        shouldFocusToggleOnSelect
                      >
                        <DropdownList>
                          {applicationWriteAccess && (
                            <>
                              <DropdownItem
                                key="manage-creditentials"
                                component="button"
                                onClick={() => {
                                  setSaveApplicationsCredentialsModalState([
                                    application,
                                  ]);
                                }}
                              >
                                Manage credentials
                              </DropdownItem>
                              <DropdownItem
                                key="delete"
                                component="button"
                                onClick={() =>
                                  setApplicationsToDelete([application])
                                }
                              >
                                {t("actions.delete")}
                              </DropdownItem>
                            </>
                          )}

                          {tasksReadAccess && (
                            <ConditionalTooltip
                              key="analysis-details"
                              isTooltipEnabled={!getTask(application)}
                              content={
                                "There is no analysis details available."
                              }
                            >
                              <DropdownItem
                                key="analysis-details"
                                isAriaDisabled={!getTask(application)}
                                onClick={() => {
                                  const task = getTask(application);
                                  if (task)
                                    setTaskToView({
                                      name: application.name,
                                      task: task.id,
                                    });
                                }}
                              >
                                {t("actions.analysisDetails")}
                              </DropdownItem>
                            </ConditionalTooltip>
                          )}

                          {tasksWriteAccess && (
                            <ConditionalTooltip
                              key="cancel-analysis"
                              isTooltipEnabled={!isTaskCancellable(application)}
                              content={
                                "There is no analysis in progress to cancel."
                              }
                            >
                              <DropdownItem
                                key="cancel-analysis"
                                isAriaDisabled={!isTaskCancellable(application)}
                                onClick={() => cancelAnalysis(application)}
                              >
                                Cancel analysis
                              </DropdownItem>
                            </ConditionalTooltip>
                          )}
                        </DropdownList>
                      </Dropdown>
                    </Td>
                  </TableRowContentWithControls>
                </Tr>
              ))}
            </Tbody>
          </ConditionalTableBody>
        </Table>
        <SimplePagination
          idPrefix="app-analysis-table"
          isTop={false}
          paginationProps={paginationProps}
        />
        <ApplicationDetailDrawerAnalysis
          application={activeItem}
          applications={applications}
          onCloseClick={clearActiveItem}
          task={activeItem ? getTask(activeItem) : null}
        />

        <ConfirmDialog
          title={t(
            applicationsToDelete.length > 1
              ? "dialog.title.delete"
              : "dialog.title.deleteWithName",
            {
              what:
                applicationsToDelete.length > 1
                  ? t("terms.application(s)").toLowerCase()
                  : t("terms.application").toLowerCase(),
              name:
                applicationsToDelete.length === 1 &&
                applicationsToDelete[0].name,
            }
          )}
          titleIconVariant={"warning"}
          isOpen={applicationsToDelete.length > 0}
          message={`${
            applicationsToDelete.length > 1
              ? t("dialog.message.applicationsBulkDelete")
              : ""
          } ${t("dialog.message.delete")}`}
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
        <TaskGroupProvider>
          <AnalysisWizard
            applications={selectedRows}
            isOpen={isAnalyzeModalOpen}
            onClose={() => {
              setAnalyzeModalOpen(false);
            }}
          />
        </TaskGroupProvider>
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
        <Modal
          title={
            createUpdateApplications
              ? t("dialog.title.updateApplication")
              : t("dialog.title.newApplication")
          }
          variant="medium"
          isOpen={isCreateUpdateApplicationsModalOpen}
          onClose={() => setSaveApplicationModalState(null)}
        >
          <ApplicationForm
            application={createUpdateApplications}
            onClose={() => setSaveApplicationModalState(null)}
          />
        </Modal>
        <SimpleDocumentViewerModal<Task | string>
          title={`Analysis details for ${taskToView?.name}`}
          fetch={getTaskById}
          documentId={taskToView?.task}
          onClose={() => setTaskToView(undefined)}
        />
        <Modal
          isOpen={isApplicationImportModalOpen}
          variant="medium"
          title={t("dialog.title.importApplicationFile")}
          onClose={() => setIsApplicationImportModalOpen((current) => !current)}
        >
          <ImportApplicationsForm
            onSaved={() => {
              setIsApplicationImportModalOpen(false);
              fetchApplications();
            }}
          />
        </Modal>
      </div>
    </ConditionalRender>
  );
};
