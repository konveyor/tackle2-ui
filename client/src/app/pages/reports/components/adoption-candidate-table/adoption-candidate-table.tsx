import React, { useCallback, useContext, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";

import {
  cellWidth,
  ICell,
  IExtraData,
  IRow,
  IRowData,
  sortable,
  TableVariant,
  truncate,
} from "@patternfly/react-table";
import { Label, ToolbarItem } from "@patternfly/react-core";

import {
  AppTableWithControls,
  ProposedActionLabel,
  RiskLabel,
  ToolbarBulkSelector,
} from "@app/shared/components";

import { EFFORT_ESTIMATE_LIST, RISK_LIST } from "@app/Constants";
import {
  Application,
  AssessmentConfidence,
  AssessmentRisk,
  Review,
  Risk,
} from "@app/api/models";
import { getAssessmentConfidence } from "@app/api/rest";

import { ApplicationSelectionContext } from "../../application-selection-context";
import { useLegacyPaginationState } from "@app/shared/hooks/useLegacyPaginationState";
import { useLegacySortState } from "@app/shared/hooks/useLegacySortState";
import { useSelectionState } from "@migtools/lib-ui";
import {
  FilterCategory,
  FilterToolbar,
  FilterType,
} from "@app/shared/components/FilterToolbar";
import { useLegacyFilterState } from "@app/shared/hooks/useLegacyFilterState";
import { useFetchReviews } from "@app/queries/reviews";
import { useQuery } from "@tanstack/react-query";
import { useFetchRisks } from "@app/queries/risks";

export interface TableRowData {
  application: Application;
  confidence?: number;
  risk: Risk;
  review: Review | undefined;
}

const ENTITY_FIELD = "entity";
const getRow = (rowData: IRowData): TableRowData => {
  return rowData[ENTITY_FIELD];
};

interface IAdoptionCandidateTable {
  selectAll?: () => void;
  areAllSelected?: boolean;
  selectedRows?: Application[];
  allApplications?: Application[];
}

export const AdoptionCandidateTable: React.FC<IAdoptionCandidateTable> = () => {
  // i18
  const { t } = useTranslation();

  const {
    allItems: allApplications,
    selectedItems: selectedApplications,
    areAllSelected: areAllApplicationsSelected,
    isItemSelected: isApplicationSelected,
    toggleItemSelected: toggleApplicationSelected,
    selectAll: selectAllApplication,
    setSelectedItems: setSelectedRows,
    selectMultiple: selectMultipleApplications,
  } = useContext(ApplicationSelectionContext);

  const {
    data: confidence,
    refetch: refreshConfidence,
    isFetching,
    error: fetchError,
  } = useQuery<AssessmentConfidence[]>(
    ["assessmentconfidence"],
    async () =>
      (
        await getAssessmentConfidence(
          allApplications.length > 0 ? allApplications.map((f) => f.id!) : []
        )
      ).data,
    {
      onError: (error) => console.log("error, ", error),
    }
  );

  const {
    reviews,
    isFetching: isFetchingReviews,
    fetchError: fetchErrorReviews,
  } = useFetchReviews();

  // Risk
  const { risks: assessmentRisks, refetch: fetchRisks } = useFetchRisks(
    allApplications.map((app) => app.id!)
  );

  // Start fetch
  useEffect(() => {
    if (allApplications.length > 0) {
      refreshConfidence();
      fetchRisks();
    }
  }, [allApplications, refreshConfidence, fetchRisks]);

  // Table data
  const allRows = useMemo(() => {
    return allApplications.map((app) => {
      const confidenceData = confidence?.find(
        (e) => e.applicationId === app.id
      );

      const reviewData = reviews?.find(
        (review) => review.id === app.review?.id
      );
      const riskData = assessmentRisks?.find((e) => e.applicationId === app.id);

      const result: TableRowData = {
        application: app,
        confidence: confidenceData?.confidence,
        risk: riskData ? riskData.risk : "UNKNOWN",
        review: reviewData ? reviewData : undefined,
      };
      return result;
    });
  }, [allApplications, confidence, assessmentRisks]);

  // Table
  const columns: ICell[] = [
    {
      title: t("terms.applicationName"),
      transforms: [sortable, cellWidth(25)],
      cellTransforms: [truncate],
    },
    {
      title: t("terms.criticality"),
      transforms: [sortable, cellWidth(15)],
      cellTransforms: [],
    },
    {
      title: t("terms.priority"),
      transforms: [sortable, cellWidth(15)],
      cellTransforms: [],
    },
    {
      title: t("terms.confidence"),
      transforms: [sortable, cellWidth(15)],
      cellTransforms: [],
    },
    {
      title: t("terms.effort"),
      transforms: [sortable, cellWidth(10)],
      cellTransforms: [],
    },
    {
      title: t("terms.risk"),
      transforms: [sortable, cellWidth(10)],
      cellTransforms: [],
    },
    {
      title: t("terms.decision"),
      transforms: [cellWidth(10)],
      cellTransforms: [],
    },
  ];

  const filterCategories: FilterCategory<TableRowData, "name">[] = [
    {
      key: "name",
      title: t("terms.name"),
      type: FilterType.search,
      placeholderText:
        t("actions.filterBy", {
          what: t("terms.name").toLowerCase(),
        }) + "...",
      getItemValue: (item) => {
        return item?.application.name || "";
      },
    },
  ];

  const { filterValues, setFilterValues, filteredItems } = useLegacyFilterState(
    allRows || [],
    filterCategories
  );

  const getSortValues = (item: TableRowData) => [
    "",
    item?.application?.name || "",
    item?.review?.businessCriticality || "",
    item?.review?.workPriority || "",
    item?.confidence || "",
    item?.review?.effortEstimate || "",
    RISK_LIST[item?.risk].sortFactor || "",
    "",
  ];
  const { sortBy, onSort, sortedItems } = useLegacySortState(
    filteredItems,
    getSortValues
  );

  const { currentPageItems, setPageNumber, paginationProps } =
    useLegacyPaginationState(sortedItems, 10);

  const rows: IRow[] = [];
  currentPageItems.forEach((item) => {
    const isSelected = isApplicationSelected(item.application);

    rows.push({
      [ENTITY_FIELD]: item,
      selected: isSelected,
      cells: [
        {
          title: item.application.name,
        },
        {
          title: item.review?.businessCriticality,
        },
        {
          title: item.review?.workPriority,
        },
        {
          title: item.confidence,
        },
        {
          title: (
            <>
              {item.review &&
                (EFFORT_ESTIMATE_LIST[item.review.effortEstimate]
                  ? t(EFFORT_ESTIMATE_LIST[item.review.effortEstimate].i18Key)
                  : item.review.effortEstimate)}
            </>
          ),
        },
        {
          title: <RiskLabel risk={item.risk} />,
        },
        {
          title: (
            <>
              {item.review ? (
                <ProposedActionLabel action={item?.review?.proposedAction} />
              ) : (
                <Label>{t("terms.notReviewed")}</Label>
              )}
            </>
          ),
        },
      ],
    });
  });

  const selectRow = (
    event: React.FormEvent<HTMLInputElement>,
    isSelected: boolean,
    rowIndex: number,
    rowData: IRowData,
    extraData: IExtraData
  ) => {
    const row = getRow(rowData);
    toggleApplicationSelected(row.application);
  };
  const handleOnClearAllFilters = () => {
    setFilterValues({});
  };

  return (
    <AppTableWithControls
      paginationProps={paginationProps}
      paginationIdPrefix="adoption-candidate"
      variant={TableVariant.compact}
      count={allApplications.length}
      sortBy={sortBy}
      onSort={onSort}
      cells={columns}
      rows={rows}
      onSelect={selectRow}
      canSelectAll={false}
      isLoading={false}
      filtersApplied={false}
      toolbarClearAllFilters={handleOnClearAllFilters}
      toolbarToggle={
        <FilterToolbar
          filterCategories={filterCategories}
          filterValues={filterValues}
          setFilterValues={setFilterValues}
        />
      }
      toolbarBulkSelector={
        <ToolbarBulkSelector
          onSelectAll={selectAllApplication}
          areAllSelected={areAllApplicationsSelected}
          selectedRows={selectedApplications}
          paginationProps={paginationProps}
          currentPageItems={currentPageItems.map((item) => item.application)}
          onSelectMultiple={selectMultipleApplications}
        />
      }
    />
  );
};
