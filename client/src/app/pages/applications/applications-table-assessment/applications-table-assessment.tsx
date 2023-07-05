import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import { AxiosError, AxiosResponse } from "axios";
import { useTranslation, Trans } from "react-i18next";

import {
  Button,
  ButtonVariant,
  DropdownItem,
  Modal,
  ToolbarGroup,
  ToolbarItem,
  TooltipPosition,
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

import {
  AppPlaceholder,
  AppTableWithControls,
  ConditionalRender,
  NoDataEmptyState,
  StatusIcon,
  KebabDropdown,
  ToolbarBulkSelector,
  ConfirmDialog,
} from "@app/shared/components";
import { ApplicationDependenciesFormContainer } from "@app/shared/containers";

import { formatPath, Paths } from "@app/Paths";
import { Application, Assessment, Task } from "@app/api/models";
import { ApplicationForm } from "../components/application-form";

import { ApplicationAssessmentStatus } from "../components/application-assessment-status";
import { ApplicationBusinessService } from "../components/application-business-service";
import { ImportApplicationsForm } from "../components/import-applications-form";
import { BulkCopyAssessmentReviewForm } from "../components/bulk-copy-assessment-review-form";
import {
  applicationsWriteScopes,
  dependenciesWriteScopes,
  importsWriteScopes,
  modifiedPathfinderWriteScopes,
  RBAC,
  RBAC_TYPE,
} from "@app/rbac";
import { checkAccess, checkAccessAll } from "@app/common/rbac-utils";
import keycloak from "@app/keycloak";
import {
  ApplicationsQueryKey,
  useBulkDeleteApplicationMutation,
  useDeleteApplicationMutation,
  useFetchApplications,
} from "@app/queries/applications";
import {
  ApplicationTableType,
  useApplicationsFilterValues,
} from "../applicationsFilter";
import { FilterToolbar } from "@app/shared/components/FilterToolbar/FilterToolbar";
import { useDeleteReviewMutation, useFetchReviews } from "@app/queries/reviews";
import {
  useDeleteAssessmentMutation,
  useFetchApplicationAssessments,
} from "@app/queries/assessments";
import { useQueryClient } from "@tanstack/react-query";
import { useEntityModal } from "@app/shared/hooks/useEntityModal";
import { useAssessApplication } from "@app/shared/hooks/useAssessApplication";
import { NotificationsContext } from "@app/shared/notifications-context";
import { useCreateBulkCopyMutation } from "@app/queries/bulkcopy";
import { ApplicationDetailDrawerAssessment } from "../components/application-detail-drawer";
import { useSetting } from "@app/queries/settings";
import { useFetchTasks } from "@app/queries/tasks";
import { getAxiosErrorMessage } from "@app/utils/utils";
import { ConditionalTooltip } from "@app/shared/components/ConditionalTooltip";

const ENTITY_FIELD = "entity";

const getRow = (rowData: IRowData): Application => {
  return rowData[ENTITY_FIELD];
};

export const ApplicationsTable: React.FC = () => {
  //RBAC
  const token = keycloak.tokenParsed;
  const { t } = useTranslation();

  const [
    isApplicationDeleteConfirmDialogOpen,
    setIsApplicationDeleteConfirmDialogOpen,
  ] = React.useState<Boolean>(false);

  const [
    isDiscardAssessmentConfirmDialogOpen,
    setIsDiscardAssessmentConfirmDialogOpen,
  ] = React.useState<Boolean>(false);

  const [
    isEditAssessmentConfirmDialogOpen,
    setIsEditAssessmentConfirmDialogOpen,
  ] = React.useState<Boolean>(false);

  const [isEditReviewConfirmDialogOpen, setIsEditReviewConfirmDialogOpen] =
    React.useState<Boolean>(false);

  const [applicationToDelete, setApplicationToDelete] =
    React.useState<number>();

  const [
    applicationAssessmentOrReviewToDiscard,
    setApplicationAssessmentOrReviewToDiscard,
  ] = React.useState<Application>();

  const [assessmentToEdit, setAssessmentToEdit] = React.useState<Assessment>();
  const [reviewToEdit, setReviewToEdit] = React.useState<number>();

  const { pushNotification } = React.useContext(NotificationsContext);
  const [isSubmittingBulkCopy, setIsSubmittingBulkCopy] = useState(false);

  // Router
  const history = useHistory();

  // Table data
  const {
    data: applications,
    isFetching,
    error: fetchError,
    refetch: fetchApplications,
  } = useFetchApplications();

  const { tasks } = useFetchTasks({ addon: "analyzer" });

  const getTask = (application: Application) =>
    tasks.find((task: Task) => task.application?.id === application.id);

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
    setPageNumber,
    openDetailDrawer,
    closeDetailDrawer,
    activeAppInDetailDrawer,
  } = useApplicationsFilterValues(
    ApplicationTableType.Assessment,
    applications
  );

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
        title: t("toastr.success.saveWhat", {
          what: response.data.name,
          type: t("terms.application").toLowerCase(),
        }),
        variant: "success",
      });
    }

    closeApplicationModal();
    fetchApplications();
  };

  // Delete
  const onDeleteApplicationSuccess = (appIDCount: number) => {
    pushNotification({
      title: t("toastr.success.applicationDeleted", {
        appIDCount: appIDCount,
      }),
      variant: "success",
    });
    fetchApplications();
  };

  const onDeleteApplicationError = (error: AxiosError) => {
    pushNotification({
      title: getAxiosErrorMessage(error),
      variant: "danger",
    });
  };

  // Copy assessment modal
  const {
    isOpen: isCopyAssessmentModalOpen,
    data: applicationToCopyAssessmentFrom,
    update: openCopyAssessmentModal,
    close: closeCopyAssessmentModal,
  } = useEntityModal<Application>();

  // Copy assessment and review modal
  const {
    isOpen: isCopyAssessmentAndReviewModalOpen,
    data: applicationToCopyAssessmentAndReviewFrom,
    update: openCopyAssessmentAndReviewModal,
    close: closeCopyAssessmentAndReviewModal,
  } = useEntityModal<Application>();

  const {
    reviews,
    isFetching: isFetchingReviews,
    fetchError: fetchErrorReviews,
  } = useFetchReviews();

  const appReview = reviews?.find(
    (review) =>
      review.id === applicationToCopyAssessmentAndReviewFrom?.review?.id
  );

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

  // Table's assessments
  const {
    getApplicationAssessment,
    isLoadingApplicationAssessment,
    fetchErrorApplicationAssessment,
  } = useFetchApplicationAssessments(applications);

  const { mutate: deleteApplication } = useDeleteApplicationMutation(
    onDeleteApplicationSuccess,
    onDeleteApplicationError
  );

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

  // Create assessment
  const { assessApplication, inProgress: isApplicationAssessInProgress } =
    useAssessApplication();

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
    { title: t("terms.assessment"), transforms: [cellWidth(10)] },
    { title: t("terms.review"), transforms: [cellWidth(10)] },
    { title: t("terms.tagCount"), transforms: [sortable, cellWidth(10)] },
    {
      title: "",
      props: {
        className: "pf-c-table__inline-edit-action",
      },
    },
  ];

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
            <ApplicationAssessmentStatus
              assessment={getApplicationAssessment(item.id!)}
              isLoading={isLoadingApplicationAssessment(item.id!)}
              fetchError={fetchErrorApplicationAssessment(item.id!)}
            />
          ),
        },
        {
          title: item.review ? (
            <StatusIcon status="Completed" />
          ) : (
            <StatusIcon status="NotStarted" />
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

    const applicationAssessment = getApplicationAssessment(row.id!);

    const userScopes: string[] = token?.scope.split(" ") || [],
      dependenciesWriteAccess = checkAccess(
        userScopes,
        dependenciesWriteScopes
      ),
      applicationWriteAccess = checkAccess(userScopes, applicationsWriteScopes);

    const actions: (IAction | ISeparator)[] = [];
    if (
      applicationAssessment?.status === "COMPLETE" &&
      checkAccess(userScopes, ["assessments:patch"])
    ) {
      actions.push({
        title: t("actions.copyAssessment"),
        onClick: () => openCopyAssessmentModal(row),
      });
    }
    if (
      row.review &&
      applicationAssessment?.status === "COMPLETE" &&
      checkAccessAll(userScopes, ["assessments:patch", "reviews:post"])
    ) {
      actions.push({
        title: t("actions.copyAssessmentAndReview"),
        onClick: () => openCopyAssessmentAndReviewModal(row),
      });
    }
    if (
      (applicationAssessment?.status || row.review) &&
      checkAccess(userScopes, ["assessments:delete"])
    ) {
      actions.push({
        title: t("actions.discardAssessment"),
        onClick: () => {
          discardAssessmentRow(row);
          fetchApplications();
        },
      });
    }
    if (applicationWriteAccess) {
      actions.push({
        title: t("actions.delete"),
        ...(row.migrationWave !== null && {
          isAriaDisabled: true,
          tooltip: "Cannot delete application assigned to a migration wave.",
          tooltipProps: { postition: TooltipPosition.top },
        }),
        onClick: () => deleteRow(row),
      });
    }

    if (dependenciesWriteAccess) {
      actions.push({
        title: t("actions.manageDependencies"),
        onClick: () => openDependenciesModal(row),
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
    setApplicationToDelete(row.id);
    setIsApplicationDeleteConfirmDialogOpen(true);
  };

  const discardAssessmentRow = (row: Application) => {
    setApplicationAssessmentOrReviewToDiscard(row);
    setIsDiscardAssessmentConfirmDialogOpen(true);
  };

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

  // Toolbar actions
  const assessSelectedRows = () => {
    if (selectedRows.length !== 1) {
      const msg = "The number of applications to be assessed must be 1";
      pushNotification({
        title: msg,
        variant: "danger",
      });
      return;
    }

    const row = selectedRows[0];
    assessApplication(
      row,
      (assessment: Assessment) => {
        if (assessment.status === "COMPLETE") {
          setAssessmentToEdit(assessment);
          setIsEditAssessmentConfirmDialogOpen(true);
        } else {
          history.push(
            formatPath(Paths.applicationsAssessment, {
              assessmentId: assessment.id,
            })
          );
        }
      },
      (error: AxiosError) => {
        pushNotification({
          title: getAxiosErrorMessage(error),
          variant: "danger",
        });
      }
    );
  };

  const { data: reviewAssessmentSetting } = useSetting(
    "review.assessment.required"
  );

  const reviewSelectedRows = () => {
    if (selectedRows.length !== 1) {
      const msg = "The number of applications to be reviewed must be 1";
      pushNotification({
        title: msg,
        variant: "danger",
      });
      return;
    }

    const row = selectedRows[0];
    if (row.review) {
      setReviewToEdit(row.id);
      setIsEditReviewConfirmDialogOpen(true);
    } else {
      history.push(
        formatPath(Paths.applicationsReview, {
          applicationId: row.id,
        })
      );
    }
  };

  // Flags
  const isReviewBtnDisabled = (row: Application) => {
    if (reviewAssessmentSetting) return false;
    const assessment = getApplicationAssessment(row.id!);
    return assessment === undefined || assessment.status !== "COMPLETE";
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
        <ConditionalTooltip
          key="delete-app-tooltip"
          isTooltipEnabled={
            selectedRows.length < 1 ||
            selectedRows.some(
              (application) => application.migrationWave !== null
            )
          }
          content={
            "Cannot delete application(s) assigned to migration wave(s)."
          }
        >
          <DropdownItem
            key="applications-bulk-delete"
            isDisabled={
              selectedRows.length < 1 ||
              selectedRows.some(
                (application) => application.migrationWave !== null
              )
            }
            onClick={() => {
              openBulkDeleteModal(selectedRows);
            }}
          >
            {t("actions.delete")}
          </DropdownItem>
        </ConditionalTooltip>,
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
          paginationIdPrefix="app-assessment"
          count={applications ? applications.length : 0}
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
                      id="assess-application"
                      aria-label="Assess Application"
                      variant={ButtonVariant.primary}
                      onClick={assessSelectedRows}
                      isDisabled={
                        selectedRows.length !== 1 ||
                        isApplicationAssessInProgress
                      }
                      isLoading={isApplicationAssessInProgress}
                    >
                      {t("actions.assess")}
                    </Button>
                  </ToolbarItem>
                </RBAC>
                <RBAC
                  allowedPermissions={modifiedPathfinderWriteScopes}
                  rbacType={RBAC_TYPE.Scope}
                >
                  <ToolbarItem>
                    <Button
                      type="button"
                      id="review-application"
                      aria-label="Review Application"
                      variant={ButtonVariant.primary}
                      onClick={reviewSelectedRows}
                      isDisabled={
                        selectedRows.length !== 1 ||
                        isReviewBtnDisabled(selectedRows[0])
                      }
                    >
                      {t("actions.review")}
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
              description={t("composed.noDataStateBody", {
                what: t("terms.application").toLowerCase(),
              })}
            />
          }
        />
        <ApplicationDetailDrawerAssessment
          application={activeAppInDetailDrawer}
          onCloseClick={closeDetailDrawer}
          reviews={reviews}
          assessment={
            (activeAppInDetailDrawer &&
              getApplicationAssessment(activeAppInDetailDrawer.id!)) ||
            null
          }
          task={
            activeAppInDetailDrawer ? getTask(activeAppInDetailDrawer) : null
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
        isOpen={isCopyAssessmentModalOpen}
        variant="large"
        title={t("dialog.title.copyApplicationAssessmentFrom", {
          what: applicationToCopyAssessmentFrom?.name,
        })}
        onClose={() => {
          closeCopyAssessmentModal();
          fetchApplications();
        }}
      >
        {applicationToCopyAssessmentFrom && (
          <BulkCopyAssessmentReviewForm
            application={applicationToCopyAssessmentFrom}
            assessment={
              getApplicationAssessment(applicationToCopyAssessmentFrom.id!)!
            }
            isSubmittingBulkCopy={isSubmittingBulkCopy}
            setIsSubmittingBulkCopy={setIsSubmittingBulkCopy}
            isCopying={isCopying}
            createCopy={createCopy}
            onSaved={() => {
              closeCopyAssessmentModal();
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
          closeCopyAssessmentAndReviewModal();
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
              closeCopyAssessmentAndReviewModal();
              fetchApplications();
            }}
          />
        )}
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
            fetchApplications();
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
      {isDiscardAssessmentConfirmDialogOpen && (
        <ConfirmDialog
          title={t("dialog.title.discard", {
            what: t("terms.assessment").toLowerCase(),
          })}
          titleIconVariant={"warning"}
          isOpen={true}
          message={
            <span>
              <Trans
                i18nKey="dialog.message.discardAssessment"
                values={{
                  applicationName: applicationAssessmentOrReviewToDiscard?.name,
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
          onCancel={() => setIsDiscardAssessmentConfirmDialogOpen(false)}
          onClose={() => setIsDiscardAssessmentConfirmDialogOpen(false)}
          onConfirm={() => {
            if (applicationAssessmentOrReviewToDiscard) {
              discardAssessmentAndReview(
                applicationAssessmentOrReviewToDiscard
              );
              setApplicationAssessmentOrReviewToDiscard(undefined);
            }
            setIsDiscardAssessmentConfirmDialogOpen(false);
          }}
        />
      )}
      {isEditAssessmentConfirmDialogOpen && (
        <ConfirmDialog
          title={t("composed.editQuestion", {
            what: t("terms.assessment").toLowerCase(),
          })}
          titleIconVariant={"warning"}
          isOpen={true}
          message={t("message.overrideAssessmentConfirmation")}
          confirmBtnVariant={ButtonVariant.primary}
          confirmBtnLabel={t("actions.continue")}
          cancelBtnLabel={t("actions.cancel")}
          onCancel={() => setIsEditAssessmentConfirmDialogOpen(false)}
          onClose={() => setIsEditAssessmentConfirmDialogOpen(false)}
          onConfirm={() => {
            history.push(
              formatPath(Paths.applicationsAssessment, {
                assessmentId: assessmentToEdit?.id,
              })
            );
            setAssessmentToEdit(undefined);
            setIsEditAssessmentConfirmDialogOpen(false);
          }}
        />
      )}
      {isEditReviewConfirmDialogOpen && (
        <ConfirmDialog
          title={t("composed.editQuestion", {
            what: t("terms.review").toLowerCase(),
          })}
          titleIconVariant={"warning"}
          isOpen={true}
          message={t("message.overrideReviewConfirmation")}
          confirmBtnVariant={ButtonVariant.primary}
          confirmBtnLabel={t("actions.continue")}
          cancelBtnLabel={t("actions.cancel")}
          onCancel={() => setIsEditReviewConfirmDialogOpen(false)}
          onClose={() => setIsEditReviewConfirmDialogOpen(false)}
          onConfirm={() => {
            history.push(
              formatPath(Paths.applicationsReview, {
                applicationId: reviewToEdit,
              })
            );
            setReviewToEdit(undefined);
            setIsEditReviewConfirmDialogOpen(false);
          }}
        />
      )}
    </>
  );
};
