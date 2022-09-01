import React, { useEffect, useState } from "react";
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

import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@app/store/rootReducer";
import { alertActions } from "@app/store/alert";
import { confirmDialogActions } from "@app/store/confirmDialog";
import { bulkCopySelectors } from "@app/store/bulkCopy";

import {
  AppPlaceholder,
  AppTableWithControls,
  ConditionalRender,
  NoDataEmptyState,
  StatusIcon,
  KebabDropdown,
  ToolbarBulkSelector,
} from "@app/shared/components";
import { ApplicationDependenciesFormContainer } from "@app/shared/containers";

import { formatPath, Paths } from "@app/Paths";

import { Application, Assessment, Review } from "@app/api/models";
import { deleteAssessment, deleteReview, getAssessments } from "@app/api/rest";
import { getAxiosErrorMessage } from "@app/utils/utils";

import { ApplicationForm } from "../components/application-form";

import { ApplicationAssessment } from "../components/application-assessment";
import { ApplicationBusinessService } from "../components/application-business-service";
import { ApplicationListExpandedArea } from "../components/application-list-expanded-area";
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
import { reviewsQueryKey, useFetchReviews } from "@app/queries/reviews";
import {
  assessmentsQueryKey,
  useFetchApplicationAssessments,
} from "@app/queries/assessments";
import { useQueryClient } from "react-query";
import { useEntityModal } from "@app/shared/hooks/useEntityModal";
import { useAssessApplication } from "@app/shared/hooks/useAssessApplication";

const ENTITY_FIELD = "entity";

const getRow = (rowData: IRowData): Application => {
  return rowData[ENTITY_FIELD];
};

export const ApplicationsTable: React.FC = () => {
  //RBAC
  const token = keycloak.tokenParsed;
  // i18
  const { t } = useTranslation();

  // Redux
  const dispatch = useDispatch();

  const isWatchingBulkCopy = useSelector((state: RootState) =>
    bulkCopySelectors.isWatching(state)
  );

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
      dispatch(
        alertActions.addSuccess(
          // t('terms.application')
          t("toastr.success.added", {
            what: response.data.name,
            type: t("terms.application").toLowerCase(),
          })
        )
      );
    }

    closeApplicationModal();
    refetch();
  };

  // Delete
  const onDeleteApplicationSuccess = (appIDCount: number) => {
    dispatch(confirmDialogActions.processing());
    dispatch(confirmDialogActions.closeDialog());
    dispatch(
      alertActions.addSuccess(
        t("toastr.success.applicationDeleted", {
          appIDCount: appIDCount,
        })
      )
    );
    refetch();
  };

  const onDeleteApplicationError = (error: AxiosError) => {
    dispatch(confirmDialogActions.closeDialog());
    dispatch(alertActions.addDanger(getAxiosErrorMessage(error)));
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

  // Create assessment
  const { assessApplication, inProgress: isApplicationAssessInProgress } =
    useAssessApplication();

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

    rows.push({
      parent: rows.length - 1,
      fullWidth: false,
      cells: [
        <div className="pf-c-table__expandable-row-content">
          <ApplicationListExpandedArea application={item} reviews={reviews} />
        </div>,
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
      applicationAssessment &&
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
          if (row.id) {
            deleteApplication({ id: row.id });
            if (currentPageItems.length === 1 && paginationProps.page) {
              setPageNumber(paginationProps.page - 1);
            } else {
              setPageNumber(1);
            }
          }
        },
      })
    );
  };

  const discardAssessmentRow = (row: Application) => {
    dispatch(
      confirmDialogActions.openDialog({
        title: t("dialog.title.discard", {
          what: t("terms.assessment").toLowerCase(),
        }),
        titleIconVariant: "warning",
        message: (
          <span>
            <Trans
              i18nKey="dialog.message.discardAssessment"
              values={{ applicationName: row.name }}
            >
              The assessment for <strong>applicationName</strong> will be
              discarded, as well as the review result. Do you wish to continue?
            </Trans>
          </span>
        ),
        confirmBtnVariant: ButtonVariant.primary,
        confirmBtnLabel: t("actions.continue"),
        cancelBtnLabel: t("actions.cancel"),
        onConfirm: () => {
          dispatch(confirmDialogActions.processing());

          Promise.all([row.review ? deleteReview(row.review.id!) : undefined])
            .then(() => {
              const assessment = getApplicationAssessment(row.id!);
              return Promise.all([
                assessment ? deleteAssessment(assessment.id!) : undefined,
              ]);
            })
            .then(() => {
              dispatch(confirmDialogActions.closeDialog());
              dispatch(
                alertActions.addSuccess(
                  t("toastr.success.assessmentDiscarded", {
                    application: row.name,
                  })
                )
              );
              refetch();
              queryClient.invalidateQueries(assessmentsQueryKey);
              queryClient.invalidateQueries(reviewsQueryKey);
            })
            .catch((error) => {
              dispatch(confirmDialogActions.closeDialog());
              dispatch(alertActions.addDanger(getAxiosErrorMessage(error)));
            });
        },
      })
    );
  };

  // Toolbar actions
  const assessSelectedRows = () => {
    if (selectedRows.length !== 1) {
      const msg = "The number of applications to be assess must be 1";
      dispatch(alertActions.addDanger(msg));
      return;
    }

    const row = selectedRows[0];
    assessApplication(
      row,
      (assessment: Assessment) => {
        const redirectToAssessment = () => {
          history.push(
            formatPath(Paths.applicationsAssessment, {
              assessmentId: assessment.id,
            })
          );
        };

        if (assessment.status === "COMPLETE") {
          dispatch(
            confirmDialogActions.openDialog({
              title: t("composed.editQuestion", {
                what: t("terms.assessment").toLowerCase(),
              }),
              titleIconVariant: "warning",
              message: t("message.overrideAssessmentConfirmation"),
              confirmBtnVariant: ButtonVariant.primary,
              confirmBtnLabel: t("actions.continue"),
              cancelBtnLabel: t("actions.cancel"),
              onConfirm: () => {
                dispatch(confirmDialogActions.closeDialog());
                redirectToAssessment();
              },
            })
          );
        } else {
          redirectToAssessment();
        }
      },
      (error) => {
        dispatch(alertActions.addDanger(getAxiosErrorMessage(error)));
      }
    );
  };

  const reviewSelectedRows = () => {
    if (selectedRows.length !== 1) {
      const msg = "The number of applications to be reviewed must be 1";
      dispatch(alertActions.addDanger(msg));
      return;
    }

    const row = selectedRows[0];
    const assessment = getApplicationAssessment(row.id!);
    if (!assessment) {
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
                      aria-label="assess-application"
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
                      aria-label="review-application"
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
        onClose={closeCopyAssessmentModal}
      >
        {applicationToCopyAssessmentFrom && (
          <BulkCopyAssessmentReviewForm
            application={applicationToCopyAssessmentFrom}
            assessment={
              getApplicationAssessment(applicationToCopyAssessmentFrom.id!)!
            }
            onSaved={() => {
              closeCopyAssessmentModal();
              refetch();
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
        onClose={closeCopyAssessmentAndReviewModal}
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
            onSaved={() => {
              closeCopyAssessmentAndReviewModal();
              refetch();
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
    </>
  );
};
