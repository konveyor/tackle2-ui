// External libraries
import * as React from "react";
import { AxiosError } from "axios";
import { useHistory } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";

// @patternfly
import {
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  Button,
  ToolbarGroup,
  ButtonVariant,
  DropdownItem,
  Modal,
  Tooltip,
} from "@patternfly/react-core";
import { PencilAltIcon, TagIcon } from "@patternfly/react-icons";
import {
  Table,
  Thead,
  Tr,
  Th,
  Td,
  ActionsColumn,
  Tbody,
} from "@patternfly/react-table";

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
import { ConfirmDialog } from "@app/components/ConfirmDialog";
import { NotificationsContext } from "@app/components/NotificationsContext";
import {
  dedupeFunction,
  formatPath,
  getAxiosErrorMessage,
} from "@app/utils/utils";
import { Paths } from "@app/Paths";
import keycloak from "@app/keycloak";
import {
  RBAC,
  RBAC_TYPE,
  analysesReadScopes,
  applicationsWriteScopes,
  assessmentWriteScopes,
  credentialsReadScopes,
  dependenciesWriteScopes,
  importsWriteScopes,
  reviewsWriteScopes,
  tasksReadScopes,
  tasksWriteScopes,
} from "@app/rbac";
import { checkAccess } from "@app/utils/rbac-utils";
import WarningTriangleIcon from "@patternfly/react-icons/dist/esm/icons/warning-triangle-icon";

// Hooks
import { useQueryClient } from "@tanstack/react-query";
import {
  deserializeFilterUrlParams,
  useLocalTableControls,
} from "@app/hooks/table-controls";

// Queries
import { Application, Assessment, Ref, Task } from "@app/api/models";
import {
  ApplicationsQueryKey,
  useBulkDeleteApplicationMutation,
  useFetchApplications,
} from "@app/queries/applications";
import { useCancelTaskMutation, useFetchTasks } from "@app/queries/tasks";
import {
  useDeleteAssessmentMutation,
  useFetchAssessments,
} from "@app/queries/assessments";
import { useDeleteReviewMutation } from "@app/queries/reviews";
import { useFetchIdentities } from "@app/queries/identities";
import { useFetchTagsWithTagItems } from "@app/queries/tags";

// Relative components
import { ApplicationAssessmentStatus } from "../components/application-assessment-status";
import { ApplicationBusinessService } from "../components/application-business-service";
import { ApplicationForm } from "../components/application-form";
import { ImportApplicationsForm } from "../components/import-applications-form";
import { ConditionalRender } from "@app/components/ConditionalRender";
import { NoDataEmptyState } from "@app/components/NoDataEmptyState";
import { ConditionalTooltip } from "@app/components/ConditionalTooltip";
import { getArchetypeById, getAssessmentsByItemId } from "@app/api/rest";
import { ApplicationDependenciesForm } from "@app/components/ApplicationDependenciesFormContainer/ApplicationDependenciesForm";
import { useState } from "react";
import { ApplicationAnalysisStatus } from "../components/application-analysis-status";
import { ApplicationDetailDrawer } from "../components/application-detail-drawer/application-detail-drawer";
import { SimpleDocumentViewerModal } from "@app/components/SimpleDocumentViewer";
import { AnalysisWizard } from "../analysis-wizard/analysis-wizard";
import { TaskGroupProvider } from "../analysis-wizard/components/TaskGroupContext";
import { ApplicationIdentityForm } from "../components/application-identity-form/application-identity-form";
import { ApplicationReviewStatus } from "../components/application-review-status/application-review-status";
import { KebabDropdown } from "@app/components/KebabDropdown";
import { useFetchArchetypes } from "@app/queries/archetypes";

export const ApplicationsTable: React.FC = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const token = keycloak.tokenParsed;

  const { pushNotification } = React.useContext(NotificationsContext);

  const { identities } = useFetchIdentities();

  const [saveApplicationModalState, setSaveApplicationModalState] =
    React.useState<"create" | Application | null>(null);

  const isCreateUpdateApplicationsModalOpen =
    saveApplicationModalState !== null;

  const createUpdateApplications =
    saveApplicationModalState !== "create" ? saveApplicationModalState : null;

  const [archetypeRefsToOverride, setArchetypeRefsToOverride] = React.useState<
    Ref[] | null
  >(null);

  const [archetypeRefsToOverrideReview, setArchetypeRefsToOverrideReview] =
    React.useState<Ref[] | null>(null);

  const [applicationToAssess, setApplicationToAssess] =
    React.useState<Application | null>(null);

  const [applicationToReview, setApplicationToReview] =
    React.useState<Application | null>(null);

  /*** Analysis */

  const [isAnalyzeModalOpen, setAnalyzeModalOpen] = useState(false);

  const getTask = (application: Application) =>
    tasks.find((task: Task) => task.application?.id === application.id);

  const { tasks, hasActiveTasks } = useFetchTasks(
    { addon: "analyzer" },
    isAnalyzeModalOpen
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
  /*** Analysis */

  const { tagItems } = useFetchTagsWithTagItems();

  const [applicationDependenciesToManage, setApplicationDependenciesToManage] =
    React.useState<Application | null>(null);
  const isDependenciesModalOpen = applicationDependenciesToManage !== null;

  const [assessmentToEdit, setAssessmentToEdit] =
    React.useState<Assessment | null>(null);

  const [reviewToEdit, setReviewToEdit] = React.useState<number | null>(null);

  const [applicationsToDelete, setApplicationsToDelete] = React.useState<
    Application[]
  >([]);

  const [assessmentToDiscard, setAssessmentToDiscard] =
    React.useState<Application | null>(null);

  const [reviewToDiscard, setReviewToDiscard] =
    React.useState<Application | null>(null);

  const {
    data: applications,
    isFetching: isFetchingApplications,
    error: applicationsFetchError,
    refetch: fetchApplications,
  } = useFetchApplications(!hasActiveTasks);

  const { assessments, isFetching: isFetchingAssesments } =
    useFetchAssessments();
  const { archetypes, isFetching: isFetchingArchetypes } = useFetchArchetypes();

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

  const onDeleteReviewSuccess = (name: string) => {
    pushNotification({
      title: t("toastr.success.reviewDiscarded", {
        application: name,
      }),
      variant: "success",
    });
    queryClient.invalidateQueries([ApplicationsQueryKey]);
  };

  const { mutate: deleteReview } = useDeleteReviewMutation(
    onDeleteReviewSuccess
  );

  const { mutate: deleteAssessment } = useDeleteAssessmentMutation();

  const discardAssessment = async (application: Application) => {
    try {
      if (application.assessments) {
        await Promise.all(
          application.assessments.map(async (assessment) => {
            await deleteAssessment({
              assessmentId: assessment.id,
              applicationName: application.name,
            });
          })
        ).then(() => {
          pushNotification({
            title: t("toastr.success.assessmentDiscarded", {
              application: application.name,
            }),
            variant: "success",
          });
          queryClient.invalidateQueries([ApplicationsQueryKey]);
        });
      }
    } catch (error) {
      console.error("Error while deleting assessments:", error);
      pushNotification({
        title: getAxiosErrorMessage(error as AxiosError),
        variant: "danger",
      });
    }
  };

  const discardReview = async (application: Application) => {
    try {
      if (application.review?.id) {
        await deleteReview({
          id: application.review.id,
          name: application.name,
        });
      }
    } catch (error) {
      console.error("Error while deleting review:", error);
      pushNotification({
        title: getAxiosErrorMessage(error as AxiosError),
        variant: "danger",
      });
    }
  };

  const urlParams = new URLSearchParams(window.location.search);
  const filters = urlParams.get("filters");

  const deserializedFilterValues = deserializeFilterUrlParams({ filters });

  const tableControls = useLocalTableControls({
    idProperty: "id",
    items: applications || [],
    columnNames: {
      name: "Name",
      businessService: "Business Service",
      assessment: "Assessment",
      review: "Review",
      analysis: "Analysis",
      tags: "Tags",
      effort: "Effort",
    },
    isFilterEnabled: true,
    isSortEnabled: true,
    isPaginationEnabled: true,
    isActiveItemEnabled: true,
    sortableColumns: ["name", "businessService", "tags", "effort"],
    initialSort: { columnKey: "name", direction: "asc" },
    initialFilterValues: deserializedFilterValues,
    getSortValues: (app) => ({
      name: app.name,
      businessService: app.businessService?.name || "",
      tags: app.tags?.length || 0,
      effort: app.effort || 0,
    }),
    filterCategories: [
      {
        key: "name",
        title: t("terms.name"),
        type: FilterType.multiselect,
        placeholderText:
          t("actions.filterBy", {
            what: t("terms.name").toLowerCase(),
          }) + "...",
        getItemValue: (item) => item?.name || "",
        selectOptions: [
          ...new Set(
            applications.map((application) => application.name).filter(Boolean)
          ),
        ].map((name) => ({ key: name, value: name })),
      },
      {
        key: "archetypes",
        title: t("terms.archetypes"),
        type: FilterType.multiselect,
        placeholderText:
          t("actions.filterBy", {
            what: t("terms.archetypes").toLowerCase(),
          }) + "...",
        getItemValue: (item) => {
          const archetypeNames = item?.archetypes
            ?.map((archetype) => archetype.name)
            .join("");
          return archetypeNames || "";
        },
        selectOptions: [
          ...new Set(
            applications
              .flatMap(
                (application) =>
                  application?.archetypes?.map((archetype) => archetype.name)
              )
              .filter(Boolean)
          ),
        ].map((archetypeName) => ({
          key: archetypeName,
          value: archetypeName,
        })),
        logicOperator: "OR",
      },
      {
        key: "businessService",
        title: t("terms.businessService"),
        placeholderText:
          t("actions.filterBy", {
            what: t("terms.businessService").toLowerCase(),
          }) + "...",
        type: FilterType.multiselect,
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
        selectOptions: tagItems.map(({ name }) => ({ key: name, value: name })),
        /**
         * Create a single string from an Application's Tags that can be used to
         * match against the `selectOptions`'s values (here on the client side)
         */
        getItemValue: (item) => {
          const appTagItems = item?.tags
            ?.map(({ id }) => tagItems.find((item) => id === item.id))
            .filter(Boolean);

          const matchString = !appTagItems
            ? ""
            : appTagItems.map(({ name }) => name).join("^");

          return matchString;
        },
      },
      {
        key: "risk",
        title: t("terms.risk"),
        type: FilterType.multiselect,
        placeholderText:
          t("actions.filterBy", {
            what: t("terms.risk").toLowerCase(),
          }) + "...",
        selectOptions: [
          { key: "green", value: "Low" },
          { key: "yellow", value: "Medium" },
          { key: "red", value: "High" },
          { key: "unknown", value: "Unknown" },
        ],
        getItemValue: (item) => item.risk || "",
      },
    ],
    initialItemsPerPage: 10,
    hasActionsColumn: true,
    isSelectionEnabled: true,
  });

  const queryClient = useQueryClient();

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

  const clearFilters = () => {
    const currentPath = history.location.pathname;
    const newSearch = new URLSearchParams(history.location.search);
    newSearch.delete("filters");
    history.push(`${currentPath}`);
    filterToolbarProps.setFilterValues({});
  };

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
    assessmentWriteAccess = checkAccess(userScopes, assessmentWriteScopes),
    credentialsReadAccess = checkAccess(userScopes, credentialsReadScopes),
    dependenciesWriteAccess = checkAccess(userScopes, dependenciesWriteScopes),
    analysesReadAccess = checkAccess(userScopes, analysesReadScopes),
    tasksReadAccess = checkAccess(userScopes, tasksReadScopes),
    tasksWriteAccess = checkAccess(userScopes, tasksWriteScopes),
    reviewsWriteAccess = checkAccess(userScopes, reviewsWriteScopes);

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
        <ConditionalTooltip
          key="delete-app-tooltip"
          isTooltipEnabled={areAppsInWaves}
          content={t("message.cannotDeleteApplicationsAssignedToMigrationWave")}
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
        ...(credentialsReadAccess
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
          : []),
      ]
    : [];

  const dropdownItems = [...importDropdownItems, ...applicationDropdownItems];

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

  const handleNavToAssessment = (application: Application) => {
    application?.id &&
      history.push(
        formatPath(Paths.applicationAssessmentActions, {
          applicationId: application?.id,
        })
      );
  };

  const handleNavToViewArchetypes = (application: Application) => {
    application?.id &&
      archetypeRefsToOverride?.length &&
      history.push(
        formatPath(Paths.viewArchetypes, {
          applicationId: application?.id,
          archetypeId: archetypeRefsToOverride[0].id,
        })
      );
  };

  const assessSelectedApp = async (application: Application) => {
    setApplicationToAssess(application);

    if (application?.archetypes?.length) {
      for (const archetypeRef of application.archetypes) {
        try {
          const assessments = await getAssessmentsByItemId(
            true,
            archetypeRef.id
          );

          if (assessments && assessments.length > 0) {
            setArchetypeRefsToOverride(application.archetypes);
            break;
          } else {
            handleNavToAssessment(application);
          }
        } catch (error) {
          console.error(
            `Error fetching archetype with ID ${archetypeRef.id}:`,
            error
          );
          pushNotification({
            title: t("terms.error"),
            variant: "danger",
          });
        }
      }
    } else {
      handleNavToAssessment(application);
    }
  };

  const reviewSelectedApp = async (application: Application) => {
    setApplicationToReview(application);
    if (application?.archetypes?.length) {
      for (const archetypeRef of application.archetypes) {
        try {
          const archetype = await getArchetypeById(archetypeRef.id);

          if (archetype?.review) {
            setArchetypeRefsToOverrideReview(application.archetypes);
            break;
          } else if (application.review) {
            setReviewToEdit(application.id);
          } else {
            history.push(
              formatPath(Paths.applicationsReview, {
                applicationId: application.id,
              })
            );
          }
        } catch (error) {
          console.error(
            `Error fetching archetype with ID ${archetypeRef.id}:`,
            error
          );
          pushNotification({
            title: t("terms.error"),
            variant: "danger",
          });
        }
      }
    } else if (application.review) {
      setReviewToEdit(application.id);
    } else {
      history.push(
        formatPath(Paths.applicationsReview, {
          applicationId: application.id,
        })
      );
    }
  };

  const applicationName = assessmentToDiscard?.name || "Application name";

  return (
    <ConditionalRender
      when={
        !!isFetchingApplications && !(applications || applicationsFetchError)
      }
      then={<AppPlaceholder />}
    >
      <div
        style={{
          backgroundColor: "var(--pf-v5-global--BackgroundColor--100)",
        }}
      >
        <Toolbar {...toolbarProps} clearAllFilters={clearFilters}>
          <ToolbarContent>
            <ToolbarBulkSelector {...toolbarBulkSelectorProps} />
            <FilterToolbar<Application, string> {...filterToolbarProps} />
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
                  <KebabDropdown
                    dropdownItems={dropdownItems}
                    ariaLabel="Application actions"
                  />
                </ToolbarItem>
              ) : (
                <></>
              )}
            </ToolbarGroup>

            <ToolbarItem {...paginationToolbarItemProps}>
              <SimplePagination
                idPrefix="app-assessments-table"
                isTop
                paginationProps={paginationProps}
              />
            </ToolbarItem>
          </ToolbarContent>
        </Toolbar>
        <Table {...tableProps} aria-label="App assessments table">
          <Thead>
            <Tr>
              <TableHeaderContentWithControls {...tableControls}>
                <Th {...getThProps({ columnKey: "name" })} width={15} />
                <Th
                  {...getThProps({ columnKey: "businessService" })}
                  width={15}
                />
                <Th {...getThProps({ columnKey: "assessment" })} width={10} />
                <Th {...getThProps({ columnKey: "review" })} width={10} />
                <Th {...getThProps({ columnKey: "analysis" })} width={10} />
                <Th {...getThProps({ columnKey: "tags" })} width={10} />
                <Th {...getThProps({ columnKey: "effort" })} width={10} />
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
              {currentPageItems?.map((application, rowIndex) => {
                const hasExistingAnalysis = tasks.some(
                  (task) => task.application?.id === application.id
                );

                return (
                  <Tr
                    key={application.name}
                    {...getTrProps({ item: application })}
                  >
                    <TableRowContentWithControls
                      {...tableControls}
                      item={application}
                      rowIndex={rowIndex}
                    >
                      <Td
                        width={15}
                        {...getTdProps({ columnKey: "name" })}
                        modifier="truncate"
                      >
                        {application.name}
                      </Td>
                      <Td
                        width={15}
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
                        width={15}
                        modifier="truncate"
                        {...getTdProps({ columnKey: "assessment" })}
                      >
                        <ApplicationAssessmentStatus
                          application={application}
                          assessments={assessments}
                          archetypes={archetypes}
                          isLoading={
                            isFetchingApplications ||
                            isFetchingArchetypes ||
                            isFetchingAssesments
                          }
                          key={`${application?.id}-assessment-status`}
                        />
                      </Td>
                      <Td
                        width={15}
                        modifier="truncate"
                        {...getTdProps({ columnKey: "review" })}
                      >
                        <ApplicationReviewStatus
                          application={application}
                          key={`${application?.id}-review-status`}
                        />
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
                      <Td
                        width={10}
                        modifier="truncate"
                        {...getTdProps({ columnKey: "effort" })}
                      >
                        {application?.effort ?? "-"}
                      </Td>

                      <Td isActionCell id="pencil-action">
                        {applicationWriteAccess && (
                          <Tooltip content={t("actions.edit")}>
                            <Button
                              variant="plain"
                              icon={<PencilAltIcon />}
                              onClick={() =>
                                setSaveApplicationModalState(application)
                              }
                            />
                          </Tooltip>
                        )}
                      </Td>
                      <Td isActionCell id="row-actions">
                        <ActionsColumn
                          items={[
                            ...(assessmentWriteAccess
                              ? [
                                  {
                                    title: t("actions.assess"),
                                    onClick: () =>
                                      assessSelectedApp(application),
                                  },
                                ]
                              : []),
                            ...(reviewsWriteAccess
                              ? [
                                  {
                                    title: t("actions.review"),
                                    onClick: () =>
                                      reviewSelectedApp(application),
                                  },
                                ]
                              : []),
                            ...(application?.assessments?.length &&
                            assessmentWriteAccess
                              ? [
                                  {
                                    title: t("actions.discardAssessment"),
                                    onClick: () =>
                                      setAssessmentToDiscard(application),
                                  },
                                ]
                              : []),
                            ...(application?.review && reviewsWriteAccess
                              ? [
                                  {
                                    title: t("actions.discardReview"),
                                    onClick: () =>
                                      setReviewToDiscard(application),
                                  },
                                ]
                              : []),
                            ...(applicationWriteAccess
                              ? [
                                  {
                                    isAriaDisabled:
                                      application.migrationWave !== null,
                                    tooltipProps: {
                                      content:
                                        application.migrationWave !== null
                                          ? t(
                                              "message.cannotDeleteApplicationsAssignedToMigrationWave"
                                            )
                                          : "",
                                    },

                                    title: t("actions.delete"),
                                    onClick: () =>
                                      setApplicationsToDelete([application]),
                                  },
                                ]
                              : []),
                            ...(dependenciesWriteAccess
                              ? [
                                  {
                                    title: t("actions.manageDependencies"),
                                    onClick: () =>
                                      setApplicationDependenciesToManage(
                                        application
                                      ),
                                  },
                                ]
                              : []),

                            ...(credentialsReadAccess && applicationWriteAccess
                              ? [
                                  {
                                    title: t("actions.manageCredentials"),
                                    onClick: () =>
                                      setSaveApplicationsCredentialsModalState([
                                        application,
                                      ]),
                                  },
                                ]
                              : []),
                            ...(analysesReadAccess && hasExistingAnalysis
                              ? [
                                  {
                                    title: t("actions.analysisDetails"),
                                    onClick: () =>
                                      setTaskToView({
                                        name: application.name,
                                        task: getTask(application)?.id,
                                      }),
                                  },
                                ]
                              : []),
                            ...(isTaskCancellable(application) &&
                            tasksReadAccess &&
                            tasksWriteAccess
                              ? [
                                  {
                                    title: t("actions.cancelAnalysis"),
                                    onClick: () => cancelAnalysis(application),
                                  },
                                ]
                              : []),
                          ]}
                        />
                      </Td>
                    </TableRowContentWithControls>
                  </Tr>
                );
              })}
            </Tbody>
          </ConditionalTableBody>
        </Table>
        <SimplePagination
          idPrefix="app-assessments-table"
          isTop={false}
          paginationProps={paginationProps}
        />
        <ApplicationDetailDrawer
          application={activeItem}
          applications={applications}
          assessments={assessments}
          archetypes={archetypes}
          onCloseClick={clearActiveItem}
          onEditClick={() => setSaveApplicationModalState(activeItem)}
          task={activeItem ? getTask(activeItem) : null}
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
        <SimpleDocumentViewerModal
          title={`Analysis details for ${taskToView?.name}`}
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
        <Modal
          isOpen={isDependenciesModalOpen}
          variant="medium"
          title={t("composed.manageDependenciesFor", {
            what: applicationDependenciesToManage?.name,
          })}
          onClose={() => setApplicationDependenciesToManage(null)}
        >
          {applicationDependenciesToManage && (
            <ApplicationDependenciesForm
              application={applicationDependenciesToManage}
              onCancel={() => setApplicationDependenciesToManage(null)}
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
              fetchApplications();
            }}
          />
        </Modal>
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
        <ConfirmDialog
          title={t("dialog.title.discard", {
            what: t("terms.assessment").toLowerCase(),
          })}
          titleIconVariant={"warning"}
          isOpen={assessmentToDiscard !== null}
          message={
            <span>
              <Trans
                i18nKey="dialog.message.discardAssessment"
                values={{ applicationName }}
              >
                The assessment(s) for <strong>{applicationName}</strong> will be
                discarded. Do you wish to continue?
              </Trans>
            </span>
          }
          confirmBtnVariant={ButtonVariant.primary}
          confirmBtnLabel={t("actions.continue")}
          cancelBtnLabel={t("actions.cancel")}
          onCancel={() => setAssessmentToDiscard(null)}
          onClose={() => setAssessmentToDiscard(null)}
          onConfirm={() => {
            discardAssessment(assessmentToDiscard!);
            setAssessmentToDiscard(null);
          }}
        />
        <ConfirmDialog
          title={t("dialog.title.discard", {
            what: t("terms.review").toLowerCase(),
          })}
          titleIconVariant={"warning"}
          isOpen={reviewToDiscard !== null}
          message={
            <span>
              <Trans
                i18nKey="dialog.message.discardReview"
                values={{
                  applicationName: reviewToDiscard?.name,
                }}
              >
                The review for <strong>{reviewToDiscard?.name}</strong> will be
                discarded, as well as the review result. Do you wish to
                continue?
              </Trans>
            </span>
          }
          confirmBtnVariant={ButtonVariant.primary}
          confirmBtnLabel={t("actions.continue")}
          cancelBtnLabel={t("actions.cancel")}
          onCancel={() => setReviewToDiscard(null)}
          onClose={() => setReviewToDiscard(null)}
          onConfirm={() => {
            discardReview(reviewToDiscard!);
            setReviewToDiscard(null);
          }}
        />
        <ConfirmDialog
          title={t("composed.editQuestion", {
            what: t("terms.assessment").toLowerCase(),
          })}
          titleIconVariant={"warning"}
          isOpen={assessmentToEdit !== null}
          message={t("message.overrideAssessmentConfirmation")}
          confirmBtnVariant={ButtonVariant.primary}
          confirmBtnLabel={t("actions.continue")}
          cancelBtnLabel={t("actions.cancel")}
          onCancel={() => setAssessmentToEdit(null)}
          onClose={() => setAssessmentToEdit(null)}
          onConfirm={() => {
            history.push(
              formatPath(Paths.applicationsAssessment, {
                assessmentId: assessmentToEdit?.id,
              })
            );
            setAssessmentToEdit(null);
          }}
        />
        <ConfirmDialog
          title={t("composed.editQuestion", {
            what: t("terms.review").toLowerCase(),
          })}
          titleIconVariant={"warning"}
          isOpen={reviewToEdit !== null}
          message={t("message.editApplicationReviewConfirmation")}
          confirmBtnVariant={ButtonVariant.primary}
          confirmBtnLabel={t("actions.continue")}
          cancelBtnLabel={t("actions.cancel")}
          onCancel={() => setReviewToEdit(null)}
          onClose={() => setReviewToEdit(null)}
          onConfirm={() => {
            history.push(
              formatPath(Paths.applicationsReview, {
                applicationId: reviewToEdit,
              })
            );
            setReviewToEdit(null);
          }}
        />
        <ConfirmDialog
          title={t("composed.new", {
            what: t("terms.review").toLowerCase(),
          })}
          alertMessage={t("message.overrideArchetypeReviewDescription", {
            what:
              archetypeRefsToOverrideReview
                ?.map((archetypeRef) => archetypeRef.name)
                .join(", ") || "Archetype name",
          })}
          message={t("message.overrideArchetypeReviewConfirmation")}
          titleIconVariant={"warning"}
          isOpen={archetypeRefsToOverrideReview !== null}
          confirmBtnVariant={ButtonVariant.primary}
          confirmBtnLabel={t("actions.override")}
          cancelBtnLabel={t("actions.cancel")}
          onCancel={() => setArchetypeRefsToOverrideReview(null)}
          onClose={() => setArchetypeRefsToOverrideReview(null)}
          onConfirm={() => {
            applicationToReview &&
              history.push(
                formatPath(Paths.applicationsReview, {
                  applicationId: applicationToReview?.id,
                })
              );
            setArchetypeRefsToOverride(null);
          }}
        />
        <ConfirmDialog
          title={t("composed.new", {
            what: t("terms.assessment").toLowerCase(),
          })}
          alertMessage={t("message.overrideAssessmentDescription", {
            what:
              archetypeRefsToOverride
                ?.map((archetypeRef) => archetypeRef.name)
                .join(", ") || "Archetype name",
          })}
          message={t("message.overrideAssessmentConfirmation")}
          titleIconVariant={"warning"}
          isOpen={archetypeRefsToOverride !== null}
          confirmBtnVariant={ButtonVariant.primary}
          confirmBtnLabel={t("actions.override")}
          cancelBtnLabel={t("actions.cancel")}
          customActionLabel={t("actions.viewArchetypes")}
          onCancel={() => setArchetypeRefsToOverride(null)}
          onClose={() => setArchetypeRefsToOverride(null)}
          onCustomAction={() => {
            applicationToAssess &&
              handleNavToViewArchetypes(applicationToAssess);
          }}
          onConfirm={() => {
            setArchetypeRefsToOverride(null);
            applicationToAssess && handleNavToAssessment(applicationToAssess);
          }}
        />
      </div>
    </ConditionalRender>
  );
};
