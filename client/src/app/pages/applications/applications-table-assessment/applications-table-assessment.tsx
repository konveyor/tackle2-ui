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

import { Application, Assessment } from "@app/api/models";
import { getAxiosErrorMessage } from "@app/utils/utils";

import { ApplicationForm } from "../components/application-form";

import { ApplicationAssessment } from "../components/application-assessment";
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
  useBulkDeleteApplicationMutation,
  useDeleteApplicationMutation,
  useFetchApplications,
} from "@app/queries/applications";
import {
  ApplicationTableType,
  useApplicationsFilterValues,
} from "../applicationsFilter";
import { FilterToolbar } from "@app/shared/components/FilterToolbar/FilterToolbar";
import {
  reviewsQueryKey,
  useDeleteReviewMutation,
  useFetchReviews,
} from "@app/queries/reviews";
import {
  assessmentsQueryKey,
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

const ENTITY_FIELD = "entity";

const getRow = (rowData: IRowData): Application => {
  return rowData[ENTITY_FIELD];
};

export const ApplicationsTable: React.FC = () => {
  //RBAC
  const token = keycloak.tokenParsed;
  // i18
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

  const [applicationToDelete, setApplicationToDelete] =
    React.useState<number>();

  const [
    applicationAssessmentOrReviewToDiscard,
    setApplicationAssessmentOrReviewToDiscard,
  ] = React.useState<Application>();

  const [assessmentToEdit, setAssessmentToEdit] = React.useState<Assessment>();

  const { pushNotification } = React.useContext(NotificationsContext);
  const [isSubmittingBulkCopy, setIsSubmittingBulkCopy] = useState(false);

  // Router
  const history = useHistory();

  // Table data
  const {
    applications,
    isFetching,
    fetchError,
    refetch: fetchApplications,
  } = useFetchApplications();

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
    applications,
    ApplicationTableType.Assessment
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
        title: t("toastr.success.added", {
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
            <ApplicationAssessment
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
        onClick: (
          event: React.MouseEvent,
          rowIndex: number,
          rowData: IRowData
        ) => {
          const row: Application = getRow(rowData);
          openCopyAssessmentModal(row);
        },
      });
    }
    if (
      row.review &&
      applicationAssessment?.status === "COMPLETE" &&
      checkAccessAll(userScopes, ["assessments:patch", "reviews:post"])
    ) {
      actions.push({
        title: t("actions.copyAssessmentAndReview"),
        onClick: (
          event: React.MouseEvent,
          rowIndex: number,
          rowData: IRowData
        ) => {
          const row: Application = getRow(rowData);
          openCopyAssessmentAndReviewModal(row);
        },
      });
    }
    if (
      (applicationAssessment?.status || row.review) &&
      checkAccess(userScopes, ["assessments:delete"])
    ) {
      actions.push({
        title: t("actions.discardAssessment"),
        onClick: (
          event: React.MouseEvent,
          rowIndex: number,
          rowData: IRowData
        ) => {
          const row: Application = getRow(rowData);
          discardAssessmentRow(row);
          fetchApplications();
        },
      });
    }
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

  const {
    mutate: deleteReview,
    isError: isDeleteReviewError,
    error: deleteReviewError,
  } = useDeleteReviewMutation();

  const {
    mutate: deleteAssessment,
    isError: isDeleteAssessmentError,
    error: deleteAssessmentError,
  } = useDeleteAssessmentMutation();

  const discardAssessmentAndReview = (application: Application) => {
    if (application.review) {
      deleteReview(application.review.id!);
      if (isDeleteReviewError) {
        pushNotification({
          title: `${deleteReviewError}`,
          variant: "danger",
        });
      } else {
        pushNotification({
          title: t("toastr.success.reviewDiscarded", {
            application: application.name,
          }),
          variant: "success",
        });
        queryClient.invalidateQueries([reviewsQueryKey]);
      }
    }

    const assessment = getApplicationAssessment(application.id!);
    if (assessment && assessment.id) {
      deleteAssessment(assessment.id);
      if (isDeleteAssessmentError) {
        pushNotification({
          title: `${deleteAssessmentError}`,
          variant: "danger",
        });
      } else {
        pushNotification({
          title: t("toastr.success.assessmentDiscarded", {
            application: application.name,
          }),
          variant: "success",
        });
        queryClient.invalidateQueries([reviewsQueryKey]);
      }
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
      (error) => {
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
    const assessment = getApplicationAssessment(row.id!);
    if (!assessment && !reviewAssessmentSetting) {
      console.log("You must assess the application before reviewing it");
      return;
    }

    history.push(
      formatPath(Paths.applicationsReview, {
        applicationId: row.id,
      })
    );
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
          onAppClick={openDetailDrawer}
          toolbarToggle={
            <FilterToolbar<Application>
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
              description={
                t("composed.noDataStateBody", {
                  what: t("terms.application").toLowerCase(),
                }) + "."
              }
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
    </>
  );
};
