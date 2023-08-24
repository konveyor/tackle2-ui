// External libraries
import * as React from "react";
import { useState } from "react";
import { AxiosError } from "axios";
import { useHistory, useLocation } from "react-router-dom";
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
  Dropdown,
  MenuToggle,
  MenuToggleElement,
  Modal,
} from "@patternfly/react-core";
import {
  PencilAltIcon,
  TagIcon,
  EllipsisVIcon,
  CubesIcon,
} from "@patternfly/react-icons";
import {
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
  TableText,
} from "@patternfly/react-table";

// @app components and utilities
import { AppPlaceholder } from "@app/components/AppPlaceholder";
import {
  FilterType,
  FilterToolbar,
  FilterCategory,
} from "@app/components/FilterToolbar/FilterToolbar";
import { SimplePagination } from "@app/components/SimplePagination";
import {
  TableHeaderContentWithControls,
  ConditionalTableBody,
  TableRowContentWithControls,
} from "@app/components/TableControls";
import { IconedStatus } from "@app/components/IconedStatus";
import { ToolbarBulkSelector } from "@app/components/ToolbarBulkSelector";
import { ApplicationDependenciesFormContainer } from "@app/components/ApplicationDependenciesFormContainer";
import { ConfirmDialog } from "@app/components/ConfirmDialog";
import { NotificationsContext } from "@app/components/NotificationsContext";
import { dedupeFunction, getAxiosErrorMessage } from "@app/utils/utils";
import { Paths, formatPath } from "@app/Paths";
import keycloak from "@app/keycloak";
import {
  RBAC,
  RBAC_TYPE,
  applicationsWriteScopes,
  importsWriteScopes,
} from "@app/rbac";
import { checkAccess } from "@app/utils/rbac-utils";

// Hooks
import { useQueryClient } from "@tanstack/react-query";
import {
  handlePropagatedRowClick,
  useLocalTableControls,
} from "@app/hooks/table-controls";
import { useAssessApplication } from "@app/hooks";

// Queries
import { Application, Assessment, Task } from "@app/api/models";
import {
  ApplicationsQueryKey,
  useBulkDeleteApplicationMutation,
  useFetchApplications,
} from "@app/queries/applications";
import { useFetchTasks } from "@app/queries/tasks";
import {
  useDeleteAssessmentMutation,
  useFetchApplicationAssessments,
} from "@app/queries/assessments";
import { useDeleteReviewMutation, useFetchReviews } from "@app/queries/reviews";
import { useFetchIdentities } from "@app/queries/identities";
import { useFetchTagCategories } from "@app/queries/tags";
import { useCreateBulkCopyMutation } from "@app/queries/bulkcopy";

// Relative components
import { ApplicationAssessmentStatus } from "../components/application-assessment-status";
import { ApplicationBusinessService } from "../components/application-business-service";
import { ApplicationDetailDrawerAssessment } from "../components/application-detail-drawer";
import { ApplicationForm } from "../components/application-form";
import { BulkCopyAssessmentReviewForm } from "../components/bulk-copy-assessment-review-form";
import { ImportApplicationsForm } from "../components/import-applications-form";
import { ConditionalRender } from "@app/components/ConditionalRender";
import { NoDataEmptyState } from "@app/components/NoDataEmptyState";
import { ConditionalTooltip } from "@app/components/ConditionalTooltip";

export const ApplicationsTable: React.FC = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const token = keycloak.tokenParsed;

  const { pushNotification } = React.useContext(NotificationsContext);

  const [isKebabOpen, setIsKebabOpen] = React.useState<number | null>(null);
  const [isToolbarKebabOpen, setIsToolbarKebabOpen] =
    React.useState<boolean>(false);

  const [saveApplicationModalState, setSaveApplicationModalState] =
    React.useState<"create" | Application | null>(null);

  const isCreateUpdateApplicationsModalOpen =
    saveApplicationModalState !== null;

  const createUpdateApplications =
    saveApplicationModalState !== "create" ? saveApplicationModalState : null;

  const [applicationToCopyAssessmentFrom, setApplicationToCopyAssessmentFrom] =
    React.useState<Application | null>(null);

  const isCopyAssessmentModalOpen = applicationToCopyAssessmentFrom !== null;

  const [isAssessModalOpen, setAssessModalOpen] = React.useState(false);

  const [
    applicationToCopyAssessmentAndReviewFrom,
    setCopyAssessmentAndReviewModalState,
  ] = React.useState<Application | null>(null);

  const isCopyAssessmentAndReviewModalOpen =
    applicationToCopyAssessmentAndReviewFrom !== null;

  const [applicationDependenciesToManage, setApplicationDependenciesToManage] =
    React.useState<Application | null>(null);
  const isDependenciesModalOpen = applicationDependenciesToManage !== null;

  const [applicationToAssess, setApplicationToAssess] =
    React.useState<Application | null>(null);

  const [assessmentToEdit, setAssessmentToEdit] =
    React.useState<Assessment | null>(null);

  const [reviewToEdit, setReviewToEdit] = React.useState<number | null>(null);

  const [applicationsToDelete, setApplicationsToDelete] = React.useState<
    Application[]
  >([]);

  const [assessmentOrReviewToDiscard, setAssessmentOrReviewToDiscard] =
    React.useState<Application | null>(null);

  const [isSubmittingBulkCopy, setIsSubmittingBulkCopy] = useState(false);

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
    clearActiveRow();
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
  const onHandleCopySuccess = (hasSuccessfulReviewCopy: boolean) => {
    setIsSubmittingBulkCopy(false);
    pushNotification({
      title: hasSuccessfulReviewCopy
        ? t("toastr.success.assessmentAndReviewCopied")
        : t("toastr.success.assessmentCopied"),
      variant: "success",
    });
    fetchApplications();
  };
  const onHandleCopyError = (error: AxiosError) => {
    setIsSubmittingBulkCopy(false);
    pushNotification({
      title: getAxiosErrorMessage(error),
      variant: "danger",
    });
    fetchApplications();
  };
  const { mutate: createCopy, isCopying } = useCreateBulkCopyMutation({
    onSuccess: onHandleCopySuccess,
    onError: onHandleCopyError,
  });

  const onDeleteReviewSuccess = (name: string) => {
    pushNotification({
      title: t("toastr.success.reviewDiscarded", {
        application: name,
      }),
      variant: "success",
    });
    queryClient.invalidateQueries([ApplicationsQueryKey]);
  };

  const onDeleteAssessmentSuccess = (name: string) => {
    pushNotification({
      title: t("toastr.success.assessmentDiscarded", {
        application: name,
      }),
      variant: "success",
    });
    queryClient.invalidateQueries([ApplicationsQueryKey]);
  };

  const onDeleteError = (error: AxiosError) => {
    pushNotification({
      title: getAxiosErrorMessage(error),
      variant: "danger",
    });
  };

  const { mutate: deleteReview } = useDeleteReviewMutation(
    onDeleteReviewSuccess,
    onDeleteError
  );

  const { mutate: deleteAssessment } = useDeleteAssessmentMutation(
    onDeleteAssessmentSuccess,
    onDeleteError
  );

  const discardAssessmentAndReview = (application: Application) => {
    if (application.review?.id)
      deleteReview({ id: application.review.id, name: application.name });

    const assessment = getApplicationAssessment(application.id!);
    if (assessment && assessment.id) {
      deleteAssessment({ id: assessment.id, name: application.name });
    }
  };

  const {
    getApplicationAssessment,
    isLoadingApplicationAssessment,
    fetchErrorApplicationAssessment,
  } = useFetchApplicationAssessments(applications);

  const { assessApplication, inProgress: isApplicationAssessInProgress } =
    useAssessApplication();

  const tableControls = useLocalTableControls({
    idProperty: "id",
    items: applications || [],
    columnNames: {
      name: "Name",
      description: "Description",
      businessService: "Business Service",
      assessment: "Assessment",
      review: "Review",
      tags: "Tags",
    },
    sortableColumns: ["name", "description", "businessService", "tags"],
    initialSort: { columnKey: "name", direction: "asc" },
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
          let tagNames = item?.tags?.map((tag) => tag.name).join("");
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
    isSelectable: true,
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
      getTdProps,
      toolbarBulkSelectorProps,
      getClickableTrProps,
    },
    activeRowDerivedState: { activeRowItem, clearActiveRow },

    selectionState: { selectedItems: selectedRows },
  } = tableControls;

  const {
    reviews,
    isFetching: isFetchingReviews,
    fetchError: fetchErrorReviews,
  } = useFetchReviews();

  const appReview = reviews?.find(
    (review) =>
      review.id === applicationToCopyAssessmentAndReviewFrom?.review?.id
  );

  const [isApplicationImportModalOpen, setIsApplicationImportModalOpen] =
    React.useState(false);

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
  const dropdownItems = [...importDropdownItems, ...applicationDeleteDropdown];

  const assessSelectedApp = (application: Application) => {
    // if application/archetype has an assessment, ask if user wants to override it
    setAssessModalOpen(true);
    setApplicationToAssess(application);
    // if()
    // assessApplication(
    //   application,
    //   (assessment: Assessment) => {
    //     if (assessment.status === "COMPLETE") {
    //       setAssessmentToEdit(assessment);
    //     } else {
    //       history.push(
    //         formatPath(Paths.applicationsAssessment, {
    //           assessmentId: assessment.id,
    //         })
    //       );
    //     }
    //   },
    //   (error: AxiosError) => {
    //     pushNotification({
    //       title: getAxiosErrorMessage(error),
    //       variant: "danger",
    //     });
    //   }
    // );
  };
  const reviewSelectedApp = (application: Application) => {
    if (application.review) {
      setReviewToEdit(application.id);
    } else {
      history.push(
        formatPath(Paths.applicationsReview, {
          applicationId: application.id,
        })
      );
    }
  };

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
              {dropdownItems.length ? (
                <ToolbarItem>
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
                idPrefix="s-table"
                isTop
                paginationProps={paginationProps}
              />
            </ToolbarItem>
          </ToolbarContent>
        </Toolbar>
        <Table {...tableProps} isExpandable aria-label="App assessments table">
          <Thead>
            <Tr>
              <TableHeaderContentWithControls {...tableControls}>
                <Th {...getThProps({ columnKey: "name" })} />
                <Th {...getThProps({ columnKey: "description" })} />
                <Th {...getThProps({ columnKey: "businessService" })} />
                <Th {...getThProps({ columnKey: "assessment" })} />
                <Th {...getThProps({ columnKey: "review" })} />
                <Th {...getThProps({ columnKey: "tags" })} />
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
                return (
                  <Tr
                    style={{ cursor: "pointer" }}
                    key={application.name}
                    {...getClickableTrProps({ item: application })}
                  >
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
                        {...getTdProps({ columnKey: "assessment" })}
                      >
                        <ApplicationAssessmentStatus
                          assessment={getApplicationAssessment(application.id!)}
                          isLoading={isLoadingApplicationAssessment(
                            application.id!
                          )}
                          fetchError={fetchErrorApplicationAssessment(
                            application.id!
                          )}
                        />
                      </Td>
                      <Td
                        width={10}
                        modifier="truncate"
                        {...getTdProps({ columnKey: "review" })}
                      >
                        <IconedStatus
                          preset={
                            application.review ? "Completed" : "NotStarted"
                          }
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
                      <Td width={20}>
                        <RBAC
                          allowedPermissions={applicationsWriteScopes}
                          rbacType={RBAC_TYPE.Scope}
                        >
                          <Button
                            type="button"
                            variant="plain"
                            onClick={() =>
                              setSaveApplicationModalState(application)
                            }
                          >
                            <PencilAltIcon />
                          </Button>
                        </RBAC>
                        <Dropdown
                          isOpen={isKebabOpen === application.id}
                          onSelect={() => setIsKebabOpen(null)}
                          onOpenChange={(_isOpen) => setIsKebabOpen(null)}
                          toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                            <MenuToggle
                              ref={toggleRef}
                              aria-label="kebab dropdown toggle"
                              variant="plain"
                              onClick={() =>
                                isKebabOpen
                                  ? setIsKebabOpen(null)
                                  : setIsKebabOpen(application.id)
                              }
                              isExpanded={isKebabOpen === rowIndex}
                            >
                              <EllipsisVIcon />
                            </MenuToggle>
                          )}
                          shouldFocusToggleOnSelect
                        >
                          <DropdownItem
                            key="assess"
                            component="button"
                            onClick={() => assessSelectedApp(application)}
                          >
                            {t("actions.assess")}
                          </DropdownItem>
                          <DropdownItem
                            key="review"
                            component="button"
                            onClick={() => reviewSelectedApp(application)}
                          >
                            {t("actions.review")}
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
                          <DropdownItem
                            key="manage-dependencies"
                            component="button"
                            onClick={() => {
                              setApplicationDependenciesToManage(application);
                            }}
                          >
                            {t("actions.manageDependencies")}
                          </DropdownItem>
                        </Dropdown>
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
        <ApplicationDetailDrawerAssessment
          application={activeRowItem}
          onCloseClick={clearActiveRow}
          reviews={reviews}
          assessment={
            (activeRowItem && getApplicationAssessment(activeRowItem.id)) ||
            null
          }
          task={activeRowItem ? getTask(activeRowItem) : null}
        />
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
        <Modal
          isOpen={isCopyAssessmentModalOpen}
          variant="large"
          title={t("dialog.title.copyApplicationAssessmentFrom", {
            what: applicationToCopyAssessmentFrom?.name,
          })}
          onClose={() => {
            setApplicationToCopyAssessmentFrom(null);
            fetchApplications();
          }}
        >
          {applicationToCopyAssessmentFrom && (
            <BulkCopyAssessmentReviewForm
              application={applicationToCopyAssessmentFrom}
              assessment={
                getApplicationAssessment(applicationToCopyAssessmentFrom.id)!
              }
              isSubmittingBulkCopy={isSubmittingBulkCopy}
              setIsSubmittingBulkCopy={setIsSubmittingBulkCopy}
              isCopying={isCopying}
              createCopy={createCopy}
              onSaved={() => {
                setApplicationToCopyAssessmentFrom(null);
                fetchApplications();
              }}
            />
          )}
        </Modal>
        <Modal
          isOpen={isCopyAssessmentAndReviewModalOpen}
          variant="large"
          title={t("dialog.title.copyApplicationAssessmentAndReviewFrom", {
            what: applicationToCopyAssessmentAndReviewFrom?.name,
          })}
          onClose={() => {
            setCopyAssessmentAndReviewModalState(null);
            fetchApplications();
          }}
        >
          {applicationToCopyAssessmentAndReviewFrom && (
            <BulkCopyAssessmentReviewForm
              application={applicationToCopyAssessmentAndReviewFrom}
              assessment={
                getApplicationAssessment(
                  applicationToCopyAssessmentAndReviewFrom.id!
                )!
              }
              review={appReview}
              isSubmittingBulkCopy={isSubmittingBulkCopy}
              setIsSubmittingBulkCopy={setIsSubmittingBulkCopy}
              isCopying={isCopying}
              createCopy={createCopy}
              onSaved={() => {
                setCopyAssessmentAndReviewModalState(null);
                fetchApplications();
              }}
            />
          )}
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
            <ApplicationDependenciesFormContainer
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
        <ConfirmDialog
          title={t("dialog.title.discard", {
            what: t("terms.assessment").toLowerCase(),
          })}
          titleIconVariant={"warning"}
          isOpen={assessmentOrReviewToDiscard !== null}
          message={
            <span>
              <Trans
                i18nKey="dialog.message.discardAssessment"
                values={{
                  applicationName: assessmentOrReviewToDiscard?.name,
                }}
              >
                The assessment for <strong>applicationName</strong> will be
                discarded, as well as the review result. Do you wish to
                continue?
              </Trans>
            </span>
          }
          confirmBtnVariant={ButtonVariant.primary}
          confirmBtnLabel={t("actions.continue")}
          cancelBtnLabel={t("actions.cancel")}
          onCancel={() => setAssessmentOrReviewToDiscard(null)}
          onClose={() => setAssessmentOrReviewToDiscard(null)}
          onConfirm={() => {
            discardAssessmentAndReview(assessmentOrReviewToDiscard!);
            setAssessmentOrReviewToDiscard(null);
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
          message={t("message.overrideReviewConfirmation")}
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
          title={t("dialog.title.newAssessment")}
          titleIconVariant={"warning"}
          isOpen={isAssessModalOpen}
          message={t("message.overrideArchetypeConfirmation")}
          confirmBtnVariant={ButtonVariant.primary}
          confirmBtnLabel={t("actions.accept")}
          cancelBtnLabel={t("actions.cancel")}
          onCancel={() => setApplicationToAssess(null)}
          onClose={() => setApplicationToAssess(null)}
          onConfirm={() => {
            applicationToAssess &&
              history.push(
                formatPath(Paths.assessmentActions, {
                  applicationId: applicationToAssess?.id,
                })
              );
            setApplicationToAssess(null);
          }}
        />
      </div>
    </ConditionalRender>
  );
};
