import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import { AxiosError } from "axios";
import { useTranslation, Trans } from "react-i18next";

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
  const { pushNotification } = React.useContext(NotificationsContext);

  const [saveApplicationsModalState, setSavesApplicationsModalState] =
    React.useState<"create" | Application | null>(null);
  const isCreateUpdateApplicationsModalOpen =
    saveApplicationsModalState !== null;
  const createUpdateApplications =
    saveApplicationsModalState !== "create" ? saveApplicationsModalState : null;

  const [applicationToCopyAssessmentFrom, setAapplicationToCopyAssessmentFrom] =
    React.useState<Application | null>(null);
  const isCopyAssessmentModalOpen = applicationToCopyAssessmentFrom !== null;

  const [
    applicationToCopyAssessmentAndReviewFrom,
    setCopyAssessmentAndReviewModalState,
  ] = React.useState<Application | null>(null);
  const isCopyAssessmentAndReviewModalOpen =
    applicationToCopyAssessmentAndReviewFrom !== null;

  const [applicationDependenciesToManage, setApplicationDependenciesToManage] =
    React.useState<Application | null>(null);
  const isDependenciesModalOpen = applicationDependenciesToManage !== null;

  const [assessmentToEdit, setAssessmentToEdit] =
    React.useState<Assessment | null>(null);

  const [reviewToEdit, setReviewToEdit] = React.useState<number | null>(null);

  const [applicationsToDelete, setApplicationsToDelete] = React.useState<
    Application[]
  >([]);

  const [assessmentOrReviewToDiscard, setAssessmentOrReviewToDiscard] =
    React.useState<Application | null>(null);

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
    openDetailDrawer,
    closeDetailDrawer,
    activeAppInDetailDrawer,
  } = useApplicationsFilterValues(
    ApplicationTableType.Assessment,
    applications
  );

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

  const {
    reviews,
    isFetching: isFetchingReviews,
    fetchError: fetchErrorReviews,
  } = useFetchReviews();

  const appReview = reviews?.find(
    (review) =>
      review.id === applicationToCopyAssessmentAndReviewFrom?.review?.id
  );

  // Application import modal
  const [isApplicationImportModalOpen, setIsApplicationImportModalOpen] =
    useState(false);

  // Table's assessments
  const {
    getApplicationAssessment,
    isLoadingApplicationAssessment,
    fetchErrorApplicationAssessment,
  } = useFetchApplicationAssessments(applications);

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
    {
      title: t("terms.assessment"),
      transforms: [cellWidth(10)],
      cellTransforms: [nowrap],
    },
    {
      title: t("terms.review"),
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
            <RBAC
              allowedPermissions={applicationsWriteScopes}
              rbacType={RBAC_TYPE.Scope}
            >
              <Button
                type="button"
                variant="plain"
                onClick={() => setSavesApplicationsModalState(item)}
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
        onClick: () => setAapplicationToCopyAssessmentFrom(row),
      });
    }
    if (
      row.review &&
      applicationAssessment?.status === "COMPLETE" &&
      checkAccessAll(userScopes, ["assessments:patch", "reviews:post"])
    ) {
      actions.push({
        title: t("actions.copyAssessmentAndReview"),
        onClick: () => setCopyAssessmentAndReviewModalState(row),
      });
    }
    if (
      (applicationAssessment?.status || row.review) &&
      checkAccess(userScopes, ["assessments:delete"])
    ) {
      actions.push({
        title: t("actions.discardAssessment"),
        onClick: () => {
          setAssessmentOrReviewToDiscard(row);
          // setIsDiscardAssessmentConfirmDialogOpen(true);
          fetchApplications();
        },
      });
    }
    if (applicationWriteAccess) {
      actions.push({
        title: t("actions.delete"),
        ...(row.migrationWave !== null && {
          isAriaDisabled: true,
          tooltipProps: {
            position: TooltipPosition.top,
            content: "Cannot delete application assigned to a migration wave.",
          },
        }),
        onClick: () => setApplicationsToDelete([row]),
      });
    }

    if (dependenciesWriteAccess) {
      actions.push({
        title: t("actions.manageDependencies"),
        onClick: () => setApplicationDependenciesToManage(row),
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
    if (row.review) setReviewToEdit(row.id);
    else {
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
                      onClick={() => {
                        setSavesApplicationsModalState("create");
                      }}
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
          createUpdateApplications
            ? t("dialog.title.updateApplication")
            : t("dialog.title.newApplication")
        }
        variant="medium"
        isOpen={isCreateUpdateApplicationsModalOpen}
        onClose={() => setSavesApplicationsModalState(null)}
      >
        <ApplicationForm
          application={createUpdateApplications}
          onClose={() => setSavesApplicationsModalState(null)}
        />
      </Modal>
      <Modal
        isOpen={isCopyAssessmentModalOpen}
        variant="large"
        title={t("dialog.title.copyApplicationAssessmentFrom", {
          what: applicationToCopyAssessmentFrom?.name,
        })}
        onClose={() => {
          setAapplicationToCopyAssessmentFrom(null);
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
              setAapplicationToCopyAssessmentFrom(null);
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
              discarded, as well as the review result. Do you wish to continue?
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
    </>
  );
};
