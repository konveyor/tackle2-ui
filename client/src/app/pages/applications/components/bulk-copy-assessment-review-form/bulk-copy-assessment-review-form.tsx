import React, { useEffect, useState } from "react";
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
} from "@patternfly/react-core";
import ExclamationTriangleIcon from "@patternfly/react-icons/dist/esm/icons/exclamation-triangle-icon";
import { global_palette_gold_400 as gold } from "@patternfly/react-tokens";

import {
  AppTableWithControls,
  StatusIcon,
  ToolbarBulkSelector,
} from "@app/shared/components";

import { Application, Assessment, Review } from "@app/api/models";

import { dedupeFunction, getAxiosErrorMessage } from "@app/utils/utils";

import { ApplicationBusinessService } from "../application-business-service";
import { ApplicationAssessment } from "../application-assessment";
import { usePaginationState } from "@app/shared/hooks/usePaginationState";
import {
  FilterCategory,
  FilterToolbar,
  FilterType,
} from "@app/shared/components/FilterToolbar";
import { useFilterState } from "@app/shared/hooks/useFilterState";
import { useSortState } from "@app/shared/hooks/useSortState";
import { useSelectionState } from "@migtools/lib-ui";
import { useFetchApplicationAssessments } from "@app/queries/assessments";
import { useFetchApplications } from "@app/queries/applications";
import { useFetchTagTypes } from "@app/queries/tags";

const ENTITY_FIELD = "entity";

const getAppFromRow = (rowData: IRowData): Application => {
  return rowData[ENTITY_FIELD];
};

interface BulkCopyAssessmentReviewFormProps {
  application: Application;
  assessment: Assessment;
  review?: Review;
  isSubmittingBulkCopy: boolean;
  setIsSubmittingBulkCopy: (val: boolean) => void;
  isCopying: boolean;
  createCopy: (copyParam: any) => void;
  onSaved: () => void;
}

export const BulkCopyAssessmentReviewForm: React.FC<
  BulkCopyAssessmentReviewFormProps
> = ({
  application,
  assessment,
  review,
  isCopying,
  isSubmittingBulkCopy,
  setIsSubmittingBulkCopy,
  createCopy,
  onSaved,
}) => {
  // i18
  const { t } = useTranslation();

  // Local state
  const [requestConfirmation, setRequestConfirmation] = useState(false);
  const [confirmationAccepted, setConfirmationAccepted] = useState(false);

  const { applications, isFetching, fetchError } = useFetchApplications();

  const { tagTypes } = useFetchTagTypes();

  const filterCategories: FilterCategory<Application>[] = [
    {
      key: "name",
      title: "Name",
      type: FilterType.search,
      placeholderText: "Filter by name...",
      getItemValue: (item) => {
        return item?.name || "";
      },
    },
    {
      key: "businessService",
      title: "Business service",
      type: FilterType.multiselect,
      selectOptions: dedupeFunction(
        applications
          .map((app) => app.businessService?.name)
          .map((name) => ({
            key: `BulkCopyAssessmentReviewForm-${name}`,
            value: name,
          }))
      ),
      placeholderText: "Filter by business service...",
      getItemValue: (item) => {
        return item.businessService?.name || "";
      },
    },
    {
      key: "description",
      title: t("terms.description"),
      type: FilterType.search,
      placeholderText:
        t("actions.filterBy", {
          what: t("terms.description").toLowerCase(),
        }) + "...",
      getItemValue: (item) => {
        return item.description || "";
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
        tagTypes
          ?.map((tagType) => tagType?.tags)
          .flat()
          .filter((tag) => tag && tag.name)
          .map((tag) => ({ key: tag?.name, value: tag?.name }))
      ),
    },
  ];

  const { filterValues, setFilterValues, filteredItems } = useFilterState(
    applications || [],
    filterCategories
  );

  const getSortValues = (item: Application) => [
    "",
    item?.name || "",
    item.businessService?.name || "",
  ];

  const { sortBy, onSort, sortedItems } = useSortState(
    filteredItems,
    getSortValues
  );

  const { currentPageItems, setPageNumber, paginationProps } =
    usePaginationState(sortedItems, 10);

  //Bulk selection
  const {
    isItemSelected: isAppSelected,
    isItemSelectable: isAppSelectable,
    toggleItemSelected: toggleAppSelected,
    selectAll,
    selectMultiple,
    areAllSelected,
    selectedItems: selectedApps,
  } = useSelectionState<Application>({
    items: filteredItems || [],
    isEqual: (a, b) => a.id === b.id,
    // Don't allow selecting source application as a copy target
    isItemSelectable: (a) => a.id !== application.id,
  });

  // Table's assessments
  const {
    getApplicationAssessment,
    isLoadingApplicationAssessment,
    fetchErrorApplicationAssessment,
  } = useFetchApplicationAssessments(applications);

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
  currentPageItems?.forEach((app) => {
    rows.push({
      [ENTITY_FIELD]: app,
      selected: isAppSelected(app),
      disableSelection: !isAppSelectable(app),
      cells: [
        {
          title: app.name,
        },
        {
          title: (
            <>
              {app.businessService && (
                <ApplicationBusinessService id={app.businessService.id} />
              )}
            </>
          ),
        },
        {
          title: (
            <ApplicationAssessment
              assessment={getApplicationAssessment(app.id!)}
              isLoading={isLoadingApplicationAssessment(app.id!)}
              fetchError={fetchErrorApplicationAssessment(app.id!)}
            />
          ),
        },
        {
          title: app.review ? (
            <StatusIcon status="Completed" />
          ) : (
            <StatusIcon status="NotStarted" />
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
    const app = getAppFromRow(rowData);
    toggleAppSelected(app);
  };

  // Confirmation checbox
  useEffect(() => {
    let selectedAnyAppWithAssessment = selectedApps.some((f) =>
      getApplicationAssessment(f.id!)
    );

    if (review) {
      const selectedAnyAppWithReview = selectedApps.some((f) => f.review);
      selectedAnyAppWithAssessment =
        selectedAnyAppWithAssessment || selectedAnyAppWithReview;
    }

    setRequestConfirmation(selectedAnyAppWithAssessment);
  }, [review, selectedApps, getApplicationAssessment]);

  useEffect(() => {
    setConfirmationAccepted(false);
  }, [requestConfirmation]);

  // Copy
  const onSubmit = () => {
    if (requestConfirmation && !confirmationAccepted) {
      console.log("Accept confirmation to continue");
      return;
    }
    setIsSubmittingBulkCopy(true);
    onSaved();
    createCopy({ assessment, selectedApps, review });
  };
  const handleOnClearAllFilters = () => {
    setFilterValues({});
  };

  return (
    <div className="pf-c-form">
      <Card>
        <CardBody style={{ padding: 0 }}>
          <AppTableWithControls
            variant="compact"
            withoutBottomPagination
            count={applications ? applications.length : 0}
            paginationProps={paginationProps}
            paginationIdPrefix="bulk-copy-assessment-review"
            sortBy={sortBy}
            onSort={onSort}
            onSelect={selectRow}
            canSelectAll={false}
            cells={columns}
            rows={rows}
            isLoading={isFetching || isCopying}
            loadingVariant="spinner"
            fetchError={fetchError}
            toolbarClearAllFilters={handleOnClearAllFilters}
            toolbarToggle={
              <FilterToolbar<Application>
                filterCategories={filterCategories}
                filterValues={filterValues}
                setFilterValues={setFilterValues}
              />
            }
            toolbarBulkSelector={
              <ToolbarBulkSelector
                isExpandable={false}
                onSelectAll={selectAll}
                areAllSelected={areAllSelected}
                selectedRows={selectedApps}
                paginationProps={paginationProps}
                currentPageItems={currentPageItems}
                onSelectMultiple={selectMultiple}
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
              <span id="warning-icon">
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
            isDisabled={isCopying}
            isChecked={confirmationAccepted}
            onChange={(isChecked) => setConfirmationAccepted(isChecked)}
          />
        </FormGroup>
      )}
      <ActionGroup>
        <Button
          type="button"
          id="copy"
          aria-label="Copy"
          variant={ButtonVariant.primary}
          onClick={onSubmit}
          isDisabled={
            selectedApps.length === 0 ||
            (requestConfirmation && !confirmationAccepted) ||
            isSubmittingBulkCopy
          }
        >
          {t("actions.copy")}
        </Button>
      </ActionGroup>
    </div>
  );
};
