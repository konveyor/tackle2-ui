// External libraries
import React, { useState } from "react";
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
  FormSelect,
  FormSelectOption,
  TextContent,
} from "@patternfly/react-core";
import {
  PencilAltIcon,
  TagIcon,
  WarningTriangleIcon,
} from "@patternfly/react-icons";

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
  formatPath,
  getAxiosErrorMessage,
  universalComparator,
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
import { normalizeRisk } from "@app/utils/type-utils";
import { checkAccess } from "@app/utils/rbac-utils";

// Hooks
import { useLocalTableControls } from "@app/hooks/table-controls";

// Queries
import { getArchetypeById, getTasksByIds } from "@app/api/rest";
import { Assessment, Ref, TaskState } from "@app/api/models";
import {
  useBulkDeleteApplicationMutation,
  useFetchApplications,
} from "@app/queries/applications";
import {
  TaskStates,
  useCancelTaskMutation,
  useCancelTasksMutation,
  useFetchTaskDashboard,
} from "@app/queries/tasks";
import { useDeleteAssessmentMutation } from "@app/queries/assessments";
import { useDeleteReviewMutation } from "@app/queries/reviews";
import { useFetchTagsWithTagItems } from "@app/queries/tags";

// Relative components
import { AnalysisWizard } from "../analysis-wizard/analysis-wizard";
import { AssetGenerationWizard } from "../asset-generation-wizard/asset-generation-wizard";
import {
  ColumnAnalysisStatus,
  mapAnalysisStateToLabel,
} from "./components/column-analysis-status";
import { ColumnAssessmentStatus } from "./components/column-assessment-status";
import { ApplicationDependenciesForm } from "@app/components/ApplicationDependenciesFormContainer/ApplicationDependenciesForm";
import { ApplicationDetailDrawer } from "../application-detail-drawer/application-detail-drawer";
import { ApplicationFormModal } from "../application-form";
import { ApplicationIdentityForm } from "../application-identity-form/application-identity-form";
import { ColumnReviewStatus } from "./components/column-review-status";
import { ConditionalRender } from "@app/components/ConditionalRender";
import { ConditionalTooltip } from "@app/components/ConditionalTooltip";
import { IconWithLabel } from "@app/components/Icons";
import { ImportApplicationsForm } from "../components/import-applications-form";
import { KebabDropdown } from "@app/components/KebabDropdown";
import { ManageColumnsToolbar } from "./components/manage-columns-toolbar";
import { NoDataEmptyState } from "@app/components/NoDataEmptyState";
import { TaskGroupProvider } from "../analysis-wizard/components/TaskGroupContext";
import { TaskGroupProvider as AssetGenerationTaskGroupProvider } from "../asset-generation-wizard/components/TaskGroupContext";
import {
  RetrieveConfigWizard,
  TaskGroupProvider as ConfigTaskGroupProvider,
} from "../retrieve-config-wizard";
import { ColumnApplicationName } from "./components/column-application-name";
import {
  DecoratedApplication,
  useDecoratedApplications,
} from "../useDecoratedApplications";
import { useBulkSelection } from "@app/hooks/selection/useBulkSelection";
import { DropdownSeparator } from "@patternfly/react-core/deprecated";

export const ApplicationsTable: React.FC = () => {
  const { t } = useTranslation();
  const { pushNotification } = React.useContext(NotificationsContext);

  const history = useHistory();
  const token = keycloak.tokenParsed;

  // ----- State for the modals
  const [saveApplicationModalState, setSaveApplicationModalState] = useState<
    "create" | DecoratedApplication | null
  >(null);

  const isCreateUpdateApplicationsModalOpen =
    saveApplicationModalState !== null;

  const createUpdateApplications =
    saveApplicationModalState !== "create" ? saveApplicationModalState : null;

  const [archetypeRefsToOverride, setArchetypeRefsToOverride] = useState<
    Ref[] | null
  >(null);

  const [archetypeRefsToOverrideReview, setArchetypeRefsToOverrideReview] =
    useState<Ref[] | null>(null);

  const [applicationToAssess, setApplicationToAssess] =
    useState<DecoratedApplication | null>(null);

  const [applicationToReview, setApplicationToReview] =
    useState<DecoratedApplication | null>(null);

  const [isAnalyzeModalOpen, setAnalyzeModalOpen] = useState(false);
  const [isRetrieveConfigModalOpen, setRetrieveConfigModalOpen] =
    useState(false);
  const [isAssetGenerationModalOpen, setAssetGenerationModalOpen] =
    useState(false);

  const [applicationDependenciesToManage, setApplicationDependenciesToManage] =
    useState<DecoratedApplication | null>(null);

  const isDependenciesModalOpen = applicationDependenciesToManage !== null;

  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  const [selectedFormat, setSelectedFormat] = useState<string>("json");

  const [assessmentToEdit, setAssessmentToEdit] = useState<Assessment | null>(
    null
  );

  const [reviewToEdit, setReviewToEdit] = useState<number | null>(null);

  const [applicationsToDelete, setApplicationsToDelete] = useState<
    DecoratedApplication[]
  >([]);
  const [tasksToCancel, setTasksToCancel] = useState<DecoratedApplication[]>(
    []
  );
  const [assessmentToDiscard, setAssessmentToDiscard] =
    useState<DecoratedApplication | null>(null);

  const [reviewToDiscard, setReviewToDiscard] =
    useState<DecoratedApplication | null>(null);

  const onChange = (
    _event: React.FormEvent<HTMLSelectElement>,
    value: string
  ) => {
    setSelectedFormat(value);
  };
  const formats = [
    { value: "select one", label: "Select one", disabled: true },
    { value: "json", label: "JSON", disabled: false },
    { value: "yaml", label: "YAML", disabled: false },
  ];

  const [
    saveApplicationsCredentialsModalState,
    setSaveApplicationsCredentialsModalState,
  ] = useState<"create" | DecoratedApplication[] | null>(null);
  const isCreateUpdateCredentialsModalOpen =
    saveApplicationsCredentialsModalState !== null;
  const applicationsCredentialsToUpdate =
    saveApplicationsCredentialsModalState !== "create"
      ? saveApplicationsCredentialsModalState
      : null;

  const [isApplicationImportModalOpen, setIsApplicationImportModalOpen] =
    useState(false);

  // ----- Table data fetches and mutations
  const { tagItems } = useFetchTagsWithTagItems();

  const { tasks } = useFetchTaskDashboard(isAnalyzeModalOpen);

  const completedCancelTask = () => {
    pushNotification({
      title: "Task",
      message: "Canceled",
      variant: "info",
    });
  };

  const handleDownload = async () => {
    const ids = selectedRows
      .map((row) => row.tasks.currentAnalyzer?.id)
      .filter((id): id is number => typeof id === "number");

    try {
      const tasks = await getTasksByIds(
        ids,
        selectedFormat === "yaml" ? "yaml" : "json"
      );

      const blob = new Blob([JSON.stringify(tasks, null, 2)], {
        type:
          selectedFormat === "json" ? "application/json" : "application/x-yaml",
      });
      const url = URL.createObjectURL(blob);
      const downloadLink = document.createElement("a");
      downloadLink.href = url;
      downloadLink.download = `logs - ${ids}.${selectedFormat}`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(url);

      setIsDownloadModalOpen(false);
    } catch (error) {
      setIsDownloadModalOpen(false);
      console.error("Error fetching tasks:", error);
      pushNotification({
        title: "download failed",
        variant: "danger",
      });
    }
  };

  const failedCancelTask = () => {
    pushNotification({
      title: "Task",
      message: "Cancelation failed.",
      variant: "danger",
    });
  };
  const completedCancelTasks = () => {
    pushNotification({
      title: "Tasks",
      message: "Canceled",
      variant: "info",
    });
  };
  const failedCancelTasks = () => {
    pushNotification({
      title: "Tasks",
      message: "Cancelation failed.",
      variant: "danger",
    });
  };

  const { mutate: cancelTask } = useCancelTaskMutation(
    completedCancelTask,
    failedCancelTask
  );
  const { mutate: cancelTasks } = useCancelTasksMutation(
    completedCancelTasks,
    failedCancelTasks
  );

  const cancelAnalysis = (
    application: DecoratedApplication | DecoratedApplication[]
  ) => {
    if (!Array.isArray(application)) {
      const task = application.tasks.currentAnalyzer;
      if (task?.id) cancelTask(task.id);
    } else {
      const tasks = application
        .map((app) => app.tasks.currentAnalyzer?.id)
        .filter((id): id is number => id !== undefined);
      cancelTasks(tasks);
    }
  };

  const isTaskCancellable = (application: DecoratedApplication) => {
    const task = application.tasks.currentAnalyzer;
    return !!task && !TaskStates.Terminal.includes(task?.state ?? "");
  };

  // TODO: Perf concerns for this query: https://github.com/konveyor/tackle2-ui/issues/2350
  const {
    data: baseApplications,
    isFetching: isFetchingApplications,
    error: applicationsFetchError,
  } = useFetchApplications();

  const {
    applications,
    applicationNames,
    referencedArchetypeRefs,
    referencedBusinessServiceRefs,
  } = useDecoratedApplications(baseApplications, tasks);

  const onDeleteApplicationSuccess = (appIDCount: number) => {
    if (applicationsToDelete.length == 1)
      pushNotification({
        title: t("toastr.success.applicationDeleted", {
          appName: applicationsToDelete[0].name,
        }),
        variant: "success",
      });
    else
      pushNotification({
        title: t("toastr.success.applicationsDeleted", {
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

  const { mutate: deleteReview } = useDeleteReviewMutation(
    (name) => {
      pushNotification({
        title: t("toastr.success.reviewDiscarded", { application: name }),
        variant: "success",
      });
    },
    (error) => {
      console.error("Error while deleting review:", error);
      pushNotification({
        title: getAxiosErrorMessage(error),
        variant: "danger",
      });
    }
  );
  const discardReview = async (application: DecoratedApplication) => {
    if (application.review) {
      deleteReview({
        id: application.review.id,
        name: application.name,
      });
    }
  };

  const { mutate: deleteAssessment } = useDeleteAssessmentMutation(
    (name) => {
      pushNotification({
        title: t("toastr.success.assessmentDiscarded", { application: name }),
        variant: "success",
      });
    },
    (error) => {
      console.error("Error while deleting assessments:", error);
      pushNotification({
        title: getAxiosErrorMessage(error),
        variant: "danger",
      });
    }
  );
  const discardAssessment = async (application: DecoratedApplication) => {
    if (application.assessments) {
      application.assessments.forEach((assessment) => {
        deleteAssessment({
          assessmentId: assessment.id,
          applicationName: application.name,
        });
      });
    }
  };

  // ----- Table controls
  const tableControls = useLocalTableControls({
    tableName: "applications",
    idProperty: "id",
    dataNameProperty: "name",
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
    persistTo: {
      activeItem: "urlParams",
      filter: "urlParams",
      pagination: "sessionStorage",
      sort: "sessionStorage",
    },
    isLoading: isFetchingApplications,
    sortableColumns: ["name", "businessService", "tags", "effort", "analysis"],
    initialSort: { columnKey: "name", direction: "asc" },
    initialColumns: {
      name: { isIdentity: true },
    },
    getSortValues: (app) => ({
      name: app.name,
      businessService: app.businessService?.name || "",
      tags: app.tags?.length || 0,
      effort: app.effort || 0,
      analysis: mapAnalysisStateToLabel(
        (app.tasks.currentAnalyzer?.state as TaskState) || "No task",
        t
      ),
    }),
    filterCategories: [
      {
        categoryKey: "name",
        title: t("terms.name"),
        type: FilterType.multiselect,
        placeholderText:
          t("actions.filterBy", {
            what: t("terms.name").toLowerCase(),
          }) + "...",
        selectOptions: applicationNames.map((name) => ({
          key: name,
          value: name,
        })),
        matcher: (filter: string, app: DecoratedApplication) =>
          app.name === filter,
      },
      {
        categoryKey: "archetypes",
        title: t("terms.archetypes"),
        type: FilterType.multiselect,
        placeholderText:
          t("actions.filterBy", {
            what: t("terms.archetypes").toLowerCase(),
          }) + "...",
        selectOptions: referencedArchetypeRefs.map(({ name }) => ({
          key: name,
          value: name,
        })),
        logicOperator: "OR",
        getItemValue: (app) => {
          const archetypeNames = app?.archetypes
            ?.map((archetype) => archetype.name)
            .join("");
          return archetypeNames || "";
        },
      },
      {
        categoryKey: "businessService",
        title: t("terms.businessService"),
        type: FilterType.multiselect,
        placeholderText:
          t("actions.filterBy", {
            what: t("terms.businessService").toLowerCase(),
          }) + "...",
        selectOptions: referencedBusinessServiceRefs.map(({ name }) => ({
          key: name,
          value: name,
        })),
        getItemValue: (app) => app.businessService?.name ?? "",
      },
      {
        categoryKey: "identities",
        title: t("terms.credentialType"),
        type: FilterType.multiselect,
        placeholderText:
          t("actions.filterBy", {
            what: t("terms.credentialType").toLowerCase(),
          }) + "...",
        selectOptions: [
          { value: "source", label: "Source" },
          { value: "maven", label: "Maven" },
          { value: "proxy", label: "Proxy" },
        ],
        getItemValue: (app) => {
          const identityKinds = app.direct.identities
            ?.map(({ kind }) => kind as string)
            ?.filter(Boolean)
            ?.join("^");

          return identityKinds ?? "";
        },
      },
      {
        categoryKey: "repository",
        title: t("terms.repositoryType"),
        type: FilterType.select,
        placeholderText:
          t("actions.filterBy", {
            what: t("terms.repositoryType").toLowerCase(),
          }) + "...",
        selectOptions: [
          { value: "git", label: "Git" },
          { value: "subversion", label: "Subversion" },
        ],
        getItemValue: (item) => item?.repository?.kind ?? "",
      },
      {
        categoryKey: "binary",
        title: t("terms.artifact"),
        type: FilterType.select,
        placeholderText:
          t("actions.filterBy", {
            what: t("terms.artifact").toLowerCase(),
          }) + "...",
        selectOptions: [
          { value: "binary", label: t("terms.artifactAssociated") },
          { value: "none", label: t("terms.artifactNotAssociated") },
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
        categoryKey: "tags",
        title: t("terms.tags"),
        type: FilterType.multiselect,
        placeholderText:
          t("actions.filterBy", {
            what: t("terms.tagName").toLowerCase(),
          }) + "...",
        selectOptions: tagItems.map(({ name, tagName, categoryName }) => ({
          value: name,
          label: tagName,
          chipLabel: tagName,
          groupLabel: categoryName,
        })),
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
        categoryKey: "risk",
        title: t("terms.risk"),
        type: FilterType.multiselect,
        placeholderText:
          t("actions.filterBy", {
            what: t("terms.risk").toLowerCase(),
          }) + "...",
        selectOptions: [
          { value: "green", label: t("risks.low") },
          { value: "yellow", label: t("risks.medium") },
          { value: "red", label: t("risks.high") },
          { value: "unknown", label: t("risks.unknown") },
          { value: "unassessed", label: t("risks.unassessed") },
        ],
        getItemValue: (item) => normalizeRisk(item.risk) ?? "",
      },

      {
        categoryKey: "analysis",
        title: t("terms.analysis"),
        type: FilterType.multiselect,
        placeholderText:
          t("actions.filterBy", {
            what: t("terms.analysis").toLowerCase(),
          }) + "...",

        selectOptions: applications
          .map((a) => {
            const value = a.tasks.currentAnalyzer?.state || "No task";
            const label = mapAnalysisStateToLabel(value as TaskState, t);
            return { value, label };
          })
          .filter((v, i, a) => a.findIndex((v2) => v2.label === v.label) === i)
          .sort((a, b) => universalComparator(a.label, b.label)),
        getItemValue: (item) => item.tasks.currentAnalyzer?.state || "No task",
      },
    ],

    initialItemsPerPage: 10,
    hasActionsColumn: false,
    isSelectionEnabled: true,
  });

  const {
    filteredItems,
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
      getColumnVisibility,
    },
    activeItemDerivedState: { activeItem, clearActiveItem },
    columnState,
  } = tableControls;

  const {
    selectedItems: selectedRows,
    propHelpers: { toolbarBulkSelectorProps, getSelectCheckboxTdProps },
  } = useBulkSelection({
    isEqual: (a, b) => a.id === b.id,
    // TODO: Pass `items` to also enable "select all items" if needed
    // items: applications,
    filteredItems,
    currentPageItems,
  });

  const clearFilters = () => {
    const currentPath = history.location.pathname;
    const newSearch = new URLSearchParams(history.location.search);
    newSearch.delete("filters");
    history.push(`${currentPath}`);
    filterToolbarProps.setFilterValues({});
  };

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

  const toolbarKebabItems = [
    importWriteAccess && (
      <DropdownItem
        key="import-applications"
        component="button"
        onClick={() => setIsApplicationImportModalOpen(true)}
      >
        {t("actions.import")}
      </DropdownItem>
    ),
    importWriteAccess && (
      <DropdownItem
        key="manage-import-applications"
        onClick={() => {
          history.push(Paths.applicationsImports);
        }}
      >
        {t("actions.manageImports")}
      </DropdownItem>
    ),
    <DropdownSeparator key="breakpoint" />,
    applicationWriteAccess && tasksReadAccess && tasksWriteAccess && (
      <DropdownItem
        key="applications-bulk-cancel"
        isDisabled={
          !selectedRows.some((application: DecoratedApplication) =>
            isTaskCancellable(application)
          )
        }
        onClick={() => {
          handleCancelBulkAnalysis();
        }}
      >
        {t("actions.cancelAnalysis")}
      </DropdownItem>
    ),
    applicationWriteAccess && (
      <DropdownItem
        key="analysis-bulk-download"
        isDisabled={
          !selectedRows.some(
            (application: DecoratedApplication) =>
              application.tasks.currentAnalyzer?.id !== undefined
          )
        }
        onClick={() => {
          setIsDownloadModalOpen(true);
        }}
      >
        {t("actions.download", { what: "analysis details" })}
      </DropdownItem>
    ),
    applicationWriteAccess && credentialsReadAccess && (
      <DropdownItem
        key="manage-applications-credentials"
        isDisabled={selectedRows.length < 1}
        onClick={() => {
          setSaveApplicationsCredentialsModalState(selectedRows);
        }}
      >
        {t("actions.manageCredentials")}
      </DropdownItem>
    ),
    <DropdownSeparator key="breakpoint" />,
    <DropdownItem
      key="change-source-platform-applications"
      component="button"
      isDisabled={selectedRows.length < 2}
      onClick={() => handleChangeSourcePlatform(selectedRows)}
    >
      {t("actions.changeSourcePlatform")}
    </DropdownItem>,
    // TODO: Add these back when we can handle the retrieve and generate operations in bulk
    // <DropdownItem
    //   key="retrieve-configurations-for-applications"
    //   component="button"
    //   isDisabled={selectedRows.length < 1}
    //   onClick={() => console.log("retrieve configurations")}
    // >
    //   {t("actions.retrieveConfigurations")}
    // </DropdownItem>,
    // <DropdownItem
    //   key="generate-assets-for-applications"
    //   component="button"
    //   isDisabled={selectedRows.length < 1}
    //   onClick={() => console.log("generate assets")}
    // >
    //   {t("actions.generateAssets")}
    // </DropdownItem>,
    <DropdownSeparator key="breakpoint" />,
    applicationWriteAccess && (
      <DropdownItem
        key="applications-bulk-delete"
        isDisabled={selectedRows.length < 1}
        className={
          selectedRows.length < 1
            ? "pf-v5-u-color-200"
            : "pf-v5-u-danger-color-100"
        }
        onClick={() => {
          setApplicationsToDelete(selectedRows);
        }}
      >
        {t("actions.delete")}
      </DropdownItem>
    ),
    applicationWriteAccess && (
      <DropdownItem
        key="generate-assets-bulk"
        isDisabled={
          selectedRows.length < 1 ||
          !selectedRows.some(
            (app) => app.archetypes && app.archetypes.length > 0
          )
        }
        onClick={() => {
          setAssetGenerationModalOpen(true);
        }}
      >
        {t("actions.generateAssets")}
      </DropdownItem>
    ),
  ].filter(Boolean);

  /**
   * Analysis on the selected applications should be allowed if:
   *   - At least 1 application is selected
   *   - No analysis is in-flight for the selected applications (only 1 analysis at a time)
   */
  const isAnalyzingAllowed = () => {
    if (selectedRows.length === 0) {
      return false;
    }

    const currentAnalyzerTasksForSelected = selectedRows
      .flatMap((app) => app.tasks.currentAnalyzer)
      .filter(Boolean);

    return (
      currentAnalyzerTasksForSelected.length === 0 ||
      currentAnalyzerTasksForSelected.every(({ state }) =>
        TaskStates.Terminal.includes(state ?? "")
      )
    );
  };

  const selectedRowsHaveExistingAnalysis = selectedRows.some(
    (app) => !!app.tasks.currentAnalyzer
  );

  const handleNavToAssessment = (application: DecoratedApplication) => {
    application?.id &&
      history.push(
        formatPath(Paths.applicationAssessmentActions, {
          applicationId: application?.id,
        })
      );
  };

  const handleNavToViewArchetypes = (application: DecoratedApplication) => {
    application?.id &&
      archetypeRefsToOverride?.length &&
      history.push(
        formatPath(Paths.viewArchetypes, {
          applicationId: application?.id,
          archetypeId: archetypeRefsToOverride[0].id,
        })
      );
  };

  const handleCancelBulkAnalysis = () => {
    const runningTasksToCancel = selectedRows.filter((application) =>
      isTaskCancellable(application)
    );
    setTasksToCancel(runningTasksToCancel);
  };

  const assessSelectedApp = async (application: DecoratedApplication) => {
    setApplicationToAssess(application);

    const archetypes = application.archetypes ?? [];
    const { directStatus, inheritedStatus } = application.assessmentStatus;
    if (
      archetypes.length === 0 ||
      directStatus === "partial" ||
      directStatus === "complete" ||
      inheritedStatus === "none"
    ) {
      handleNavToAssessment(application);
    } else {
      setArchetypeRefsToOverride(archetypes);
    }
  };

  const reviewSelectedApp = async (application: DecoratedApplication) => {
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

  const handleRetrieveConfigurations = (_app: DecoratedApplication) => {
    // TODO: Implement this with #2288
    console.log("retrieve configurations coming with #2288");
  };

  const handleGenerateAssets = (_app: DecoratedApplication) => {
    // TODO: Implement this with #2294
    console.log("generate assets coming with #2294");
  };

  const handleChangeSourcePlatform = (_apps: DecoratedApplication[]) => {
    // TODO: Implement this with #2509
    console.log("change source platform coming with #2509");
  };

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
            <FilterToolbar<DecoratedApplication, string>
              {...filterToolbarProps}
            />
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
                      isTooltipEnabled={selectedRowsHaveExistingAnalysis}
                      content={
                        "An analysis for one or more of the selected applications exists. This operation will overwrite pre-existing analysis data."
                      }
                    >
                      <Button
                        icon={
                          selectedRowsHaveExistingAnalysis ? (
                            <WarningTriangleIcon />
                          ) : null
                        }
                        type="button"
                        id="analyze-application"
                        aria-label="Analyze Application"
                        variant={ButtonVariant.primary}
                        onClick={() => {
                          setAnalyzeModalOpen(true);
                        }}
                        isDisabled={!isAnalyzingAllowed()}
                      >
                        {t("actions.analyze")}
                      </Button>
                    </ConditionalTooltip>
                  </ToolbarItem>
                </RBAC>
              </ToolbarItem>
            </ToolbarGroup>
            <ToolbarGroup variant="icon-button-group">
              {toolbarKebabItems.length ? (
                <ToolbarItem id="toolbar-kebab">
                  <KebabDropdown
                    dropdownItems={toolbarKebabItems}
                    ariaLabel="Application actions"
                  />
                </ToolbarItem>
              ) : (
                <></>
              )}
              <ManageColumnsToolbar
                columns={columnState.columns}
                setColumns={columnState.setColumns}
                defaultColumns={columnState.defaultColumns}
              />
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
                {getColumnVisibility("name") && (
                  <Th {...getThProps({ columnKey: "name" })} width={10} />
                )}
                {getColumnVisibility("businessService") && (
                  <Th
                    {...getThProps({ columnKey: "businessService" })}
                    width={15}
                  />
                )}
                {getColumnVisibility("assessment") && (
                  <Th {...getThProps({ columnKey: "assessment" })} width={15} />
                )}
                {getColumnVisibility("review") && (
                  <Th {...getThProps({ columnKey: "review" })} width={15} />
                )}
                {getColumnVisibility("analysis") && (
                  <Th {...getThProps({ columnKey: "analysis" })} width={15} />
                )}
                {getColumnVisibility("tags") && (
                  <Th {...getThProps({ columnKey: "tags" })} width={10} />
                )}
                {getColumnVisibility("effort") && (
                  <Th
                    {...getThProps({ columnKey: "effort" })}
                    width={10}
                    info={{
                      tooltip: `${t("message.applicationEffortTooltip")}`,
                    }}
                  />
                )}
                <Th screenReaderText="primary action" />
                <Th screenReaderText="secondary actions" />
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
                  how: t("terms.create"),
                  what: t("terms.application").toLowerCase(),
                })}
              />
            }
            numRenderedColumns={numRenderedColumns}
          >
            <Tbody>
              {currentPageItems?.map((application, rowIndex) => (
                <Tr key={application.id} {...getTrProps({ item: application })}>
                  <TableRowContentWithControls
                    {...tableControls}
                    getSelectCheckboxTdProps={getSelectCheckboxTdProps}
                    item={application}
                    rowIndex={rowIndex}
                  >
                    {getColumnVisibility("name") && (
                      <Td
                        width={10}
                        {...getTdProps({ columnKey: "name" })}
                        modifier="truncate"
                      >
                        <ColumnApplicationName application={application} />
                      </Td>
                    )}
                    {getColumnVisibility("businessService") && (
                      <Td
                        width={15}
                        {...getTdProps({ columnKey: "businessService" })}
                        modifier="truncate"
                      >
                        {application.direct.businessService ? (
                          application.direct.businessService.name
                        ) : (
                          <></>
                        )}
                      </Td>
                    )}
                    {getColumnVisibility("assessment") && (
                      <Td
                        width={15}
                        modifier="truncate"
                        {...getTdProps({ columnKey: "assessment" })}
                      >
                        <ColumnAssessmentStatus
                          application={application}
                          key={`${application?.id}-assessment-status`}
                        />
                      </Td>
                    )}
                    {getColumnVisibility("review") && (
                      <Td
                        width={15}
                        modifier="truncate"
                        {...getTdProps({ columnKey: "review" })}
                      >
                        <ColumnReviewStatus
                          application={application}
                          key={`${application?.id}-review-status`}
                        />
                      </Td>
                    )}
                    {getColumnVisibility("analysis") && (
                      <Td
                        width={15}
                        modifier="truncate"
                        {...getTdProps({ columnKey: "analysis" })}
                      >
                        <ColumnAnalysisStatus
                          state={
                            application.tasks.currentAnalyzer?.state ||
                            "No task"
                          }
                        />
                      </Td>
                    )}
                    {getColumnVisibility("tags") && (
                      <Td
                        width={10}
                        modifier="truncate"
                        {...getTdProps({ columnKey: "tags" })}
                      >
                        <IconWithLabel
                          icon={<TagIcon />}
                          label={application.tags ? application.tags.length : 0}
                        />
                      </Td>
                    )}
                    {getColumnVisibility("effort") && (
                      <Td
                        width={10}
                        modifier="truncate"
                        {...getTdProps({ columnKey: "effort" })}
                      >
                        {application?.effort ?? "-"}
                      </Td>
                    )}
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
                          assessmentWriteAccess && {
                            title: t("actions.assess"),
                            onClick: () => assessSelectedApp(application),
                          },
                          assessmentWriteAccess &&
                            (application.assessments?.length ?? 0) > 0 && {
                              title: t("actions.discardAssessment"),
                              onClick: () =>
                                setAssessmentToDiscard(application),
                            },
                          reviewsWriteAccess && {
                            title: t("actions.review"),
                            onClick: () => reviewSelectedApp(application),
                          },
                          reviewsWriteAccess &&
                            application?.review && {
                              title: t("actions.discardReview"),
                              onClick: () => setReviewToDiscard(application),
                            },
                          dependenciesWriteAccess && {
                            title: t("actions.manageDependencies"),
                            onClick: () =>
                              setApplicationDependenciesToManage(application),
                          },
                          credentialsReadAccess &&
                            applicationWriteAccess && {
                              title: t("actions.manageCredentials"),
                              onClick: () =>
                                setSaveApplicationsCredentialsModalState([
                                  application,
                                ]),
                            },
                          analysesReadAccess &&
                            !!application.tasks.currentAnalyzer && {
                              title: t("actions.analysisDetails"),
                              onClick: () => {
                                const taskId =
                                  application.tasks.currentAnalyzer?.id;
                                if (taskId && application.id) {
                                  history.push(
                                    formatPath(
                                      Paths.applicationsAnalysisDetails,
                                      {
                                        applicationId: application.id,
                                        taskId,
                                      }
                                    )
                                  );
                                }
                              },
                            },
                          tasksReadAccess &&
                            tasksWriteAccess &&
                            isTaskCancellable(application) && {
                              title: t("actions.cancelAnalysis"),
                              onClick: () => cancelAnalysis(application),
                            },

                          applicationWriteAccess &&
                            (application.isReadyForGenerateAssets ||
                              application.isReadyForRetrieveConfigurations) && {
                              isSeparator: true,
                            },
                          applicationWriteAccess &&
                            application.isReadyForRetrieveConfigurations && {
                              title: t("actions.retrieveConfigurations"),
                              onClick: () =>
                                handleRetrieveConfigurations(application),
                            },
                          applicationWriteAccess &&
                            application.isReadyForGenerateAssets && {
                              title: t("actions.generateAssets"),
                              onClick: () => handleGenerateAssets(application),
                            },

                          applicationWriteAccess && { isSeparator: true },
                          applicationWriteAccess && {
                            title: t("actions.delete"),
                            onClick: () =>
                              setApplicationsToDelete([application]),
                            isDanger: true,
                          },
                        ].filter(Boolean)}
                      />
                    </Td>
                  </TableRowContentWithControls>
                </Tr>
              ))}
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
          onCloseClick={clearActiveItem}
          onEditClick={() => setSaveApplicationModalState(activeItem)}
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
        <ConfigTaskGroupProvider>
          <RetrieveConfigWizard
            applications={selectedRows}
            isOpen={isRetrieveConfigModalOpen}
            onClose={() => {
              setRetrieveConfigModalOpen(false);
            }}
          />
        </ConfigTaskGroupProvider>
        <AssetGenerationTaskGroupProvider>
          <AssetGenerationWizard
            applications={selectedRows}
            isOpen={isAssetGenerationModalOpen}
            onClose={() => {
              setAssetGenerationModalOpen(false);
            }}
          />
        </AssetGenerationTaskGroupProvider>
        <Modal
          isOpen={isCreateUpdateCredentialsModalOpen}
          variant="medium"
          title="Manage credentials"
          onClose={() => setSaveApplicationsCredentialsModalState(null)}
        >
          {applicationsCredentialsToUpdate && (
            <ApplicationIdentityForm
              applications={applicationsCredentialsToUpdate.map((a) => a._)}
              onClose={() => setSaveApplicationsCredentialsModalState(null)}
            />
          )}
        </Modal>
        {isCreateUpdateApplicationsModalOpen && (
          <ApplicationFormModal
            application={createUpdateApplications?._ ?? null}
            onClose={() => setSaveApplicationModalState(null)}
          />
        )}
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
              application={applicationDependenciesToManage._}
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
          title={t(
            tasksToCancel.length > 1
              ? "dialog.title.cancel"
              : "dialog.title.cancelWithName",
            {
              what:
                tasksToCancel.length > 1
                  ? t("terms.tasks").toLowerCase()
                  : t("terms.task").toLowerCase(),
              name: tasksToCancel.length === 1 && tasksToCancel[0].name,
            }
          )}
          titleIconVariant={"warning"}
          isOpen={tasksToCancel.length > 0}
          message={`${
            tasksToCancel.length > 1 ? t("dialog.message.TasksBulkCancel") : ""
          } ${t("dialog.message.cancel")}`}
          aria-label="Tasks bulk cancel"
          confirmBtnVariant={ButtonVariant.danger}
          confirmBtnLabel={t("actions.cancelTasks")}
          cancelBtnLabel={t("actions.cancel")}
          onCancel={() => setTasksToCancel([])}
          onClose={() => setTasksToCancel([])}
          onConfirm={() => {
            cancelAnalysis(tasksToCancel);
            setTasksToCancel([]);
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
                values={{
                  applicationName: assessmentToDiscard?.name,
                }}
              />
            </span>
          }
          confirmBtnVariant={ButtonVariant.primary}
          confirmBtnLabel={t("actions.continue")}
          cancelBtnLabel={t("actions.cancel")}
          onCancel={() => setAssessmentToDiscard(null)}
          onClose={() => setAssessmentToDiscard(null)}
          onConfirm={() => {
            if (assessmentToDiscard !== null) {
              discardAssessment(assessmentToDiscard);
              setAssessmentToDiscard(null);
            }
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
              />
            </span>
          }
          confirmBtnVariant={ButtonVariant.primary}
          confirmBtnLabel={t("actions.continue")}
          cancelBtnLabel={t("actions.cancel")}
          onCancel={() => setReviewToDiscard(null)}
          onClose={() => setReviewToDiscard(null)}
          onConfirm={() => {
            if (reviewToDiscard !== null) {
              discardReview(reviewToDiscard);
              setReviewToDiscard(null);
            }
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
            name: applicationToReview?.name,
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
            name: applicationToAssess?.name,
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
      <Modal
        variant="small"
        title={t("actions.download", { what: "analysis details" })}
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        actions={[
          <Button key="confirm" variant="primary" onClick={handleDownload}>
            Download
          </Button>,
          <Button
            key="cancel"
            variant="link"
            onClick={() => setIsDownloadModalOpen(false)}
          >
            Cancel
          </Button>,
        ]}
      >
        <TextContent>{"Select format"}</TextContent>
        <FormSelect
          value={selectedFormat}
          onChange={onChange}
          aria-label="FormSelect Input"
          ouiaId="BasicFormSelect"
        >
          {formats.map((option, index) => (
            <FormSelectOption
              isDisabled={option.disabled}
              key={index}
              value={option.value}
              label={option.label}
            />
          ))}
        </FormSelect>
      </Modal>
    </ConditionalRender>
  );
};
