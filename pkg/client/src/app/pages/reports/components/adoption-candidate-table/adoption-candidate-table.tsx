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

import { useFetch, useTableControls, useTableFilter } from "@app/shared/hooks";
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
  Risk,
} from "@app/api/models";
import { getAssessmentConfidence, getAssessmentLandscape } from "@app/api/rest";

import { ApplicationSelectionContext } from "../../application-selection-context";
import { usePaginationState } from "@app/shared/hooks/usePaginationState";
import { useSortState } from "@app/shared/hooks/useSortState";
import { useSelectionState } from "@konveyor/lib-ui";

export interface TableRowData {
  application: Application;
  confidence?: number;
  risk: Risk;
}

export enum ColumnIndex {
  APP_NAME = 1,
  CRITICALITY = 2,
  PRIORITY = 3,
  CONFIDENCE = 4,
  EFFORT = 5,
}

export const compareToByColumn = (
  a: TableRowData,
  b: TableRowData,
  columnIndex?: number
) => {
  switch (columnIndex) {
    case ColumnIndex.APP_NAME: // AppName
      return a.application.name.localeCompare(b.application.name);
    case ColumnIndex.CRITICALITY: // Criticality
      return (
        (a.application.review?.businessCriticality ?? -1) -
        (b.application.review?.businessCriticality ?? -1)
      );
    case ColumnIndex.PRIORITY: // Priority
      return (
        (a.application.review?.workPriority ?? -1) -
        (b.application.review?.workPriority ?? -1)
      );
    case ColumnIndex.CONFIDENCE: // Confidence
      return (a.confidence ?? -1) - (b.confidence ?? -1);
    case ColumnIndex.EFFORT: // Effort
      const aEffortSortFactor = a.application.review
        ? EFFORT_ESTIMATE_LIST[a.application.review.effortEstimate]
            ?.sortFactor || 0
        : 0;
      const bEffortSortFactor = b.application.review
        ? EFFORT_ESTIMATE_LIST[b.application.review.effortEstimate]
            ?.sortFactor || 0
        : 0;
      return aEffortSortFactor - bEffortSortFactor;
    case 6: // Risk
      return RISK_LIST[a.risk].sortFactor - RISK_LIST[b.risk].sortFactor;
    default:
      return 0;
  }
};

const filterItem = () => true;

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

export const AdoptionCandidateTable: React.FunctionComponent<
  IAdoptionCandidateTable
> = ({
  // selectAll,
  // areAllSelected,
  // selectedRows: selectedApplications,
  allApplications = [],
}: IAdoptionCandidateTable) => {
  // i18
  const { t } = useTranslation();

  // Context
  // const {
  //   allItems: allApplications,
  //   selectedItems: selectedApplications,
  //   areAllSelected: areAllApplicationsSelected,
  //   isItemSelected: isApplicationSelected,
  //   toggleItemSelected: toggleApplicationSelected,
  //   selectAll: selectAllApplication,
  //   setSelectedItems: setSelectedRows,
  // } = useContext(ApplicationSelectionContext);

  // Confidence
  const fetchChartData = useCallback(() => {
    return getAssessmentConfidence(allApplications.map((app) => app.id!)).then(
      ({ data }) => data
    );
  }, [allApplications]);

  const { data: confidence, requestFetch: refreshConfidence } = useFetch<
    AssessmentConfidence[]
  >({
    defaultIsFetching: true,
    onFetchPromise: fetchChartData,
  });

  // Risk
  const fetchRiskData = useCallback(() => {
    if (allApplications.length > 0) {
      return getAssessmentLandscape(allApplications.map((f) => f.id!)).then(
        ({ data }) => data
      );
    } else {
      return Promise.resolve([]);
    }
  }, [allApplications]);

  const { data: risks, requestFetch: refreshRisks } = useFetch<
    AssessmentRisk[]
  >({
    defaultIsFetching: true,
    onFetchPromise: fetchRiskData,
  });

  // Start fetch
  useEffect(() => {
    if (allApplications.length > 0) {
      refreshConfidence();
      refreshRisks();
    }
  }, [allApplications, refreshConfidence, refreshRisks]);

  // Table data
  const allRows = useMemo(() => {
    return allApplications.map((app) => {
      const confidenceData = confidence?.find(
        (e) => e.applicationId === app.id
      );
      const riskData = risks?.find((e) => e.applicationId === app.id);

      const result: TableRowData = {
        application: app,
        confidence: confidenceData?.confidence,
        risk: riskData ? riskData.risk : "UNKNOWN",
      };
      return result;
    });
  }, [allApplications, confidence, risks]);

  const getSortValues = (item: TableRowData) => [
    "",
    "",
    "",
    "",
    "",
    "", // Action column
  ];

  const { sortBy, onSort, sortedItems } = useSortState(allRows, getSortValues);

  const { currentPageItems, setPageNumber, paginationProps } =
    usePaginationState(sortedItems, 10);

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

  // const isApplicationSelected = (application: Application) =>
  //   selectedApplications.some((row) => row.id === application.id);
  const {
    isItemSelected: isRowSelected,
    toggleItemSelected: toggleRowSelected,
    selectAll,
    selectMultiple,
    areAllSelected,
    selectedItems: selectedRows,
  } = useSelectionState<TableRowData>({
    items: allRows || [],
    isEqual: (a, b) => a.application.id === b.application.id,
  });

  const rows: IRow[] = [];
  currentPageItems.forEach((item) => {
    // const isSelected = isApplicationSelected(item.application);
    const isSelected = isRowSelected(item);

    rows.push({
      [ENTITY_FIELD]: item,
      selected: isSelected,
      cells: [
        {
          title: item.application.name,
        },
        {
          title: item.application.review?.businessCriticality,
        },
        {
          title: item.application.review?.workPriority,
        },
        {
          title: item.confidence,
        },
        {
          title: (
            <>
              {item.application.review &&
                (EFFORT_ESTIMATE_LIST[item.application.review.effortEstimate]
                  ? t(
                      EFFORT_ESTIMATE_LIST[
                        item.application.review.effortEstimate
                      ].i18Key
                    )
                  : item.application.review.effortEstimate)}
            </>
          ),
        },
        {
          title: <RiskLabel risk={item.risk} />,
        },
        {
          title: (
            <>
              {item.application.review ? (
                <ProposedActionLabel
                  action={item.application.review.proposedAction}
                />
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
    toggleRowSelected(row);
  };

  return (
    <AppTableWithControls
      paginationProps={paginationProps}
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
      // toolbarToggle={
      //   <>
      //     <ToolbarItem variant="bulk-select">
      //       <ToolbarBulkSelector
      //         isFetching={false}
      //         areAllRowsSelected={areAllApplicationsSelected}
      //         pageSize={pagination.perPage}
      //         totalItems={allApplications.length}
      //         totalSelectedRows={selectedApplications.length}
      //         onSelectAll={selectAllApplication}
      //         onSelectNone={() => setSelectedRows([])}
      //         onSelectCurrentPage={() => {
      //           setSelectedRows(pageItems.map((f) => f.application));
      //         }}
      //       />
      //     </ToolbarItem>
      //   </>
      // }
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
    />
  );
};
