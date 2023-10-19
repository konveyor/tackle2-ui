import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";

import {
  cellWidth,
  ICell,
  IRow,
  IRowData,
  sortable,
  TableVariant,
  truncate,
} from "@patternfly/react-table";

import { RISK_LIST } from "@app/Constants";
import { Application, Assessment, Ref, Risk } from "@app/api/models";

import { AppTableWithControls } from "@app/components/AppTableWithControls";
import {
  FilterCategory,
  FilterType,
  FilterToolbar,
} from "@app/components/FilterToolbar";
import { RiskLabel } from "@app/components/RiskLabel";
import { useLegacyFilterState } from "@app/hooks/useLegacyFilterState";
import { useLegacyPaginationState } from "@app/hooks/useLegacyPaginationState";
import { useLegacySortState } from "@app/hooks/useLegacySortState";
import { useFetchAssessments } from "@app/queries/assessments";

export interface TableRowData {
  application?: Ref | null;
  archetype?: Ref | null;
  confidence?: number;
  risk: Risk;
  // review: Review | undefined;
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

  // Table data
  // const { reviews } = useFetchReviews();
  const { assessments } = useFetchAssessments();

  const allRows = useMemo(() => {
    return assessments.map((assessment: Assessment) => {
      const result: TableRowData = {
        application: assessment?.application || null,
        archetype: assessment?.archetype || null,
        confidence: assessment.confidence,
        risk: assessment.risk,
        // review: reviewData ? reviewData : undefined,
      };
      return result;
    });
  }, [assessments]);

  // Table
  const columns: ICell[] = [
    {
      title: t("terms.applicationName"),
      transforms: [sortable, cellWidth(25)],
      cellTransforms: [truncate],
    },
    {
      title: t("terms.archetypeName"),
      transforms: [sortable, cellWidth(25)],
      cellTransforms: [truncate],
    },
    // {
    //   title: t("terms.criticality"),
    //   transforms: [sortable, cellWidth(15)],
    //   cellTransforms: [],
    // },
    // {
    //   title: t("terms.priority"),
    //   transforms: [sortable, cellWidth(15)],
    //   cellTransforms: [],
    // },
    {
      title: t("terms.confidence"),
      transforms: [sortable, cellWidth(15)],
      cellTransforms: [],
    },
    // {
    //   title: t("terms.effort"),
    //   transforms: [sortable, cellWidth(10)],
    //   cellTransforms: [],
    // },
    {
      title: t("terms.risk"),
      transforms: [sortable, cellWidth(10)],
      cellTransforms: [],
    },
    // {
    //   title: t("terms.decision"),
    //   transforms: [cellWidth(10)],
    //   cellTransforms: [],
    // },
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
        return item?.application?.name || "";
      },
    },
  ];

  const { filterValues, setFilterValues, filteredItems } = useLegacyFilterState(
    allRows || [],
    filterCategories
  );

  const getSortValues = (item: TableRowData) => [
    "",
    // item?.application?.name || "",
    // item?.archety?.name || "",
    // item?.review?.businessCriticality || "",
    // item?.review?.workPriority || "",
    item?.confidence || "",
    // item?.review?.effortEstimate || "",
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
    // const isSelected = isApplicationSelected(item.application);

    rows.push({
      [ENTITY_FIELD]: item,
      // selected: isSelected,
      cells: [
        {
          title: item.application?.name || "N/A",
        },
        {
          title: item.archetype?.name || "N/A",
        },
        // {
        //   title: item.review?.businessCriticality,
        // },
        // {
        //   title: item.review?.workPriority,
        // },
        {
          title: item.confidence,
        },
        // {
        //   title: (
        //     <>
        //       {item.review &&
        //         (EFFORT_ESTIMATE_LIST[item.review.effortEstimate]
        //           ? t(EFFORT_ESTIMATE_LIST[item.review.effortEstimate].i18Key)
        //           : item.review.effortEstimate)}
        //     </>
        //   ),
        // },
        {
          title: <RiskLabel risk={item.risk} />,
        },
        // {
        //   title: (
        //     <>
        //       {item.review ? (
        //         <ProposedActionLabel action={item?.review?.proposedAction} />
        //       ) : (
        //         <Label>{t("terms.notReviewed")}</Label>
        //       )}
        //     </>
        //   ),
        // },
      ],
    });
  });

  // const selectRow = (
  //   event: React.FormEvent<HTMLInputElement>,
  //   isSelected: boolean,
  //   rowIndex: number,
  //   rowData: IRowData,
  //   extraData: IExtraData
  // ) => {
  //   const row = getRow(rowData);
  //   toggleApplicationSelected(row.application);
  // };
  const handleOnClearAllFilters = () => {
    setFilterValues({});
  };

  return (
    <AppTableWithControls
      paginationProps={paginationProps}
      paginationIdPrefix="adoption-candidate"
      variant={TableVariant.compact}
      count={assessments.length}
      sortBy={sortBy}
      onSort={onSort}
      cells={columns}
      rows={rows}
      // onSelect={selectRow}
      // canSelectAll={false}
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
      // toolbarBulkSelector={
      //   <ToolbarBulkSelector
      //     onSelectAll={selectAllApplication}
      //     areAllSelected={areAllApplicationsSelected}
      //     selectedRows={selectedApplications}
      //     paginationProps={paginationProps}
      //     currentPageItems={currentPageItems.map((item) => item.application)}
      //     onSelectMultiple={selectMultipleApplications}
      //   />
      // }
    />
  );
};
