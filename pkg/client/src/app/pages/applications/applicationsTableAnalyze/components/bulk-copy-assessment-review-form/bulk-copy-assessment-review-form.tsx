import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  cellWidth,
  ICell,
  IExtraData,
  IRow,
  IRowData,
  sortable,
  truncate,
} from "@patternfly/react-table";
import {
  ActionGroup,
  Button,
  ButtonVariant,
  Card,
  CardBody,
  Checkbox,
  FormGroup,
  ToolbarChip,
  ToolbarItem,
} from "@patternfly/react-core";
import { ExclamationTriangleIcon } from "@patternfly/react-icons/dist/esm/icons/exclamation-triangle-icon";
import { global_palette_gold_400 as gold } from "@patternfly/react-tokens";

import { useDispatch } from "react-redux";
import { alertActions } from "@app/store/alert";
import { bulkCopyActions } from "@app/store/bulkCopy";

import {
  ApplicationToolbarToggleGroup,
  AppTableWithControls,
  StatusIconAssessment,
  ToolbarBulkSelector,
} from "@app/shared/components";
import {
  useFetch,
  useMultipleFetch,
  useTableControls,
  useToolbarFilter,
  useSelectionFromPageState,
  useFetchPagination,
} from "@app/shared/hooks";

import {
  Application,
  ApplicationPage,
  Assessment,
  Review,
  SortByQuery,
} from "@app/api/models";

import { ApplicationFilterKey } from "@app/Constants";
import {
  ApplicationSortBy,
  ApplicationSortByQuery,
  createBulkCopyAssessment,
  createBulkCopyReview,
  getApplications,
  getAssessments,
} from "@app/api/rest";
import { applicationPageMapper } from "@app/api/apiUtils";
import { getAxiosErrorMessage } from "@app/utils/utils";

import { ApplicationBusinessService } from "../application-business-service";
import { ApplicationAssessment } from "../application-assessment";

const toSortByQuery = (
  sortBy?: SortByQuery
): ApplicationSortByQuery | undefined => {
  if (!sortBy) {
    return undefined;
  }

  let field: ApplicationSortBy;
  switch (sortBy.index) {
    case 1:
      field = ApplicationSortBy.NAME;
      break;
    default:
      return undefined;
  }

  return {
    field,
    direction: sortBy.direction,
  };
};

const ENTITY_FIELD = "entity";

const getRow = (rowData: IRowData): Application => {
  return rowData[ENTITY_FIELD];
};

const searchAppAssessment = (id: number) => {
  const result = getAssessments({ applicationId: id }).then(({ data }) =>
    data[0] ? data[0] : undefined
  );
  return result;
};

interface BulkCopyAssessmentReviewFormProps {
  application: Application;
  assessment: Assessment;
  review?: Review;
  onSaved: () => void;
}

export const BulkCopyAssessmentReviewForm: React.FC<
  BulkCopyAssessmentReviewFormProps
> = ({ application, assessment, review, onSaved }) => {
  // i18
  const { t } = useTranslation();

  // Redux
  const dispatch = useDispatch();

  // Local state
  const [requestConfirmation, setRequestConfirmation] = useState(false);
  const [confirmationAccepted, setConfirmationAccepted] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toolbar filters
  const {
    filters: filtersValue,
    isPresent: areFiltersPresent,
    addFilter,
    setFilter,
    clearAllFilters,
  } = useToolbarFilter<ToolbarChip>();

  // Table data
  const {
    paginationQuery: pagination,
    sortByQuery: sortBy,
    handlePaginationChange,
    handleSortChange,
  } = useTableControls({
    sortByQuery: { direction: "asc", index: 1 },
  });

  const fetchApplications = useCallback(() => {
    const nameVal = filtersValue.get(ApplicationFilterKey.NAME);
    const descriptionVal = filtersValue.get(ApplicationFilterKey.DESCRIPTION);
    const serviceVal = filtersValue.get(ApplicationFilterKey.BUSINESS_SERVICE);
    const tagVal = filtersValue.get(ApplicationFilterKey.TAG);
    return getApplications(
      {
        name: nameVal?.map((f) => f.key),
        description: descriptionVal?.map((f) => f.key),
        businessService: serviceVal?.map((f) => f.key),
        tag: tagVal?.map((f) => f.key),
      },
      pagination,
      toSortByQuery(sortBy)
    );
  }, [filtersValue, pagination, sortBy]);

  const {
    data: page,
    isFetching,
    fetchError,
    requestFetch: refreshTable,
  } = useFetch<ApplicationPage>({
    defaultIsFetching: true,
    onFetch: fetchApplications,
  });

  const applications = useMemo(() => {
    return page ? applicationPageMapper(page) : undefined;
  }, [page]);

  useEffect(() => {
    refreshTable();
  }, [filtersValue, pagination, sortBy, refreshTable]);

  // Fetch all applications for SELECT ALL
  const fetchAllApplications = useCallback(
    (page: number, perPage: number) => {
      const nameVal = filtersValue.get(ApplicationFilterKey.NAME);
      const descriptionVal = filtersValue.get(ApplicationFilterKey.DESCRIPTION);
      const serviceVal = filtersValue.get(
        ApplicationFilterKey.BUSINESS_SERVICE
      );
      const tagVal = filtersValue.get(ApplicationFilterKey.TAG);
      return getApplications(
        {
          name: nameVal?.map((f) => f.key),
          description: descriptionVal?.map((f) => f.key),
          businessService: serviceVal?.map((f) => f.key),
          tag: tagVal?.map((f) => f.key),
        },
        { page, perPage }
      );
    },
    [filtersValue]
  );

  const continueFetchingAllAppsIf = useCallback(
    (page: ApplicationPage, currentPage: number, currentPageSize: number) => {
      return page.total_count > currentPage * currentPageSize;
    },
    []
  );

  const allAppsResponseToArray = useCallback(
    (page: ApplicationPage) => applicationPageMapper(page).data,
    []
  );

  const {
    data: allApps,
    isFetching: isFetchingAllApps,
    fetchError: fetchErrorAllApps,
    requestFetch: refreshAllApps,
  } = useFetchPagination<ApplicationPage, Application>({
    requestFetch: fetchAllApplications,
    continueIf: continueFetchingAllAppsIf,
    toArray: allAppsResponseToArray,
  });

  useEffect(() => {
    refreshAllApps(1, 1000);
  }, [filtersValue, refreshAllApps]);

  // Table's assessments
  const {
    getData: getApplicationAssessment,
    isFetching: isFetchingApplicationAssessment,
    fetchError: fetchErrorApplicationAssessment,
    fetchCount: fetchCountApplicationAssessment,
    triggerFetch: fetchApplicationsAssessment,
  } = useMultipleFetch<number, Assessment | undefined>({
    onFetchPromise: searchAppAssessment,
  });

  useEffect(() => {
    if (applications) {
      fetchApplicationsAssessment(applications.data.map((f) => f.id!));
    }
  }, [applications, fetchApplicationsAssessment]);

  // Select rows
  const {
    selectedItems: selectedRows,
    areAllSelected: areAllApplicationsSelected,
    isItemSelected: isRowSelected,
    toggleItemSelected: toggleRowSelected,
    setSelectedItems: setSelectedRows,
  } = useSelectionFromPageState<Application>({
    pageItems: applications?.data || [],
    totalItems: applications?.meta.count || 0,
    isEqual: (a, b) => a.id === b.id,
  });

  const filterInvalidRows = (rows?: Application[]) => {
    return (rows ? rows : []).filter((f) => f.id !== application.id);
  };

  // Table
  const columns: ICell[] = [
    {
      title: t("terms.name"),
      transforms: [sortable, cellWidth(40)],
      cellTransforms: [truncate],
    },
    {
      title: t("terms.businessService"),
      transforms: [cellWidth(30)],
      cellTransforms: [truncate],
    },
    {
      title: t("terms.assessment"),
      transforms: [cellWidth(15)],
      cellTransforms: [truncate],
    },
    {
      title: t("terms.review"),
      transforms: [cellWidth(15)],
      cellTransforms: [truncate],
    },
  ];

  const rows: IRow[] = [];
  applications?.data.forEach((item) => {
    const isSelected = isRowSelected(item);

    rows.push({
      [ENTITY_FIELD]: item,
      selected: isSelected,
      disableSelection: item.id === application.id,
      cells: [
        {
          title: item.name,
        },
        {
          title: (
            <>
              {item.businessService && (
                <ApplicationBusinessService id={item.businessService} />
              )}
            </>
          ),
        },
        {
          title: (
            <ApplicationAssessment
              assessment={getApplicationAssessment(item.id!)}
              isFetching={isFetchingApplicationAssessment(item.id!)}
              fetchError={fetchErrorApplicationAssessment(item.id!)}
              fetchCount={fetchCountApplicationAssessment(item.id!)}
            />
          ),
        },
        {
          title: item.review ? (
            <StatusIconAssessment status="Completed" />
          ) : (
            <StatusIconAssessment status="NotStarted" />
          ),
        },
      ],
    });
  });

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

  // Confirmation checbox
  useEffect(() => {
    let selectedAnyAppWithAssessment = selectedRows.some((f) =>
      getApplicationAssessment(f.id!)
    );

    if (review) {
      const selectedAnyAppWithReview = selectedRows.some((f) => f.review);
      selectedAnyAppWithAssessment =
        selectedAnyAppWithAssessment || selectedAnyAppWithReview;
    }

    setRequestConfirmation(selectedAnyAppWithAssessment);
  }, [review, selectedRows, getApplicationAssessment]);

  useEffect(() => {
    setConfirmationAccepted(false);
  }, [requestConfirmation]);

  // Copy
  const onSubmit = () => {
    if (requestConfirmation && !confirmationAccepted) {
      console.log("Accept confirmation to continue");
      return;
    }

    setIsSubmitting(true);

    createBulkCopyAssessment({
      fromAssessmentId: assessment.id!,
      applications: selectedRows.map((f) => ({ applicationId: f.id! })),
    })
      .then((bulkAssessment) => {
        const bulkReview = review
          ? createBulkCopyReview({
              sourceReview: review!.id!,
              targetApplications: selectedRows.map((f) => f.id!),
            })
          : undefined;
        return Promise.all([bulkAssessment, bulkReview]);
      })
      .then(([assessmentBulk, reviewBulk]) => {
        setIsSubmitting(false);

        dispatch(
          bulkCopyActions.scheduleWatchBulk({
            assessmentBulk: assessmentBulk.data.bulkId!,
            reviewBulk: reviewBulk ? reviewBulk.data.id! : undefined,
          })
        );
        onSaved();
      })
      .catch((error) => {
        setIsSubmitting(false);

        dispatch(alertActions.addDanger(getAxiosErrorMessage(error)));
        onSaved();
      });
  };

  return (
    <div className="pf-c-form">
      <Card>
        <CardBody style={{ padding: 0 }}>
          <AppTableWithControls
            variant="compact"
            withoutBottomPagination
            count={applications ? applications.meta.count : 0}
            pagination={pagination}
            sortBy={sortBy}
            onPaginationChange={handlePaginationChange}
            onSort={handleSortChange}
            onSelect={selectRow}
            canSelectAll={false}
            cells={columns}
            rows={rows}
            isLoading={isFetching}
            loadingVariant="skeleton"
            fetchError={fetchError}
            toolbarClearAllFilters={clearAllFilters}
            filtersApplied={areFiltersPresent}
            toolbarBulkSelector={
              <ToolbarItem variant="bulk-select">
                <ToolbarBulkSelector
                  isFetching={isFetchingAllApps}
                  fetchError={fetchErrorAllApps}
                  areAllRowsSelected={areAllApplicationsSelected}
                  pageSize={applications?.data.length || 0}
                  totalItems={applications?.meta.count || 0}
                  totalSelectedRows={selectedRows.length}
                  onSelectNone={() => setSelectedRows([])}
                  onSelectCurrentPage={() => {
                    const rows = filterInvalidRows(applications?.data);
                    setSelectedRows(rows);
                  }}
                  onSelectAll={() => {
                    const rows = filterInvalidRows(allApps);
                    setSelectedRows(rows);
                  }}
                />
              </ToolbarItem>
            }
            toolbarToggle={
              <ApplicationToolbarToggleGroup
                value={filtersValue as Map<ApplicationFilterKey, ToolbarChip[]>}
                addFilter={addFilter}
                setFilter={setFilter}
              />
            }
          />
        </CardBody>
      </Card>
      {requestConfirmation && (
        <FormGroup
          fieldId="confirm"
          label={
            <>
              <span aria-label="warning-icon">
                <ExclamationTriangleIcon noVerticalAlign color={gold.value} />
              </span>
              &nbsp;&nbsp;
              {review
                ? t("message.copyAssessmentAndReviewQuestion")
                : t("message.copyAssessmentQuestion")}
            </>
          }
          isStack
        >
          {review
            ? t("message.copyAssessmentAndReviewBody")
            : t("message.copyAssessmentBody")}
          <Checkbox
            id="confirm"
            name="confirm"
            label={t("message.continueConfirmation")}
            aria-label="Confirm"
            isChecked={confirmationAccepted}
            onChange={(isChecked) => setConfirmationAccepted(isChecked)}
          />
        </FormGroup>
      )}
      <ActionGroup>
        <Button
          type="button"
          aria-label="copy"
          variant={ButtonVariant.primary}
          onClick={onSubmit}
          isDisabled={
            selectedRows.length === 0 ||
            (requestConfirmation && !confirmationAccepted) ||
            isSubmitting
          }
        >
          {t("actions.copy")}
        </Button>
      </ActionGroup>
    </div>
  );
};
