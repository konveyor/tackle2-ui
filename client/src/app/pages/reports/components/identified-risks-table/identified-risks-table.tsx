import React, { useContext, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  breakWord,
  cellWidth,
  ICell,
  IRow,
  TableVariant,
} from "@patternfly/react-table";

import { AppTableWithControls } from "@app/components/AppTableWithControls";

import { Application, AssessmentQuestionRisk } from "@app/api/models";
// import { getAssessmentIdentifiedRisks } from "@app/api/rest";

import { ApplicationSelectionContext } from "../../application-selection-context";
import { useLegacyPaginationState } from "@app/hooks/useLegacyPaginationState";
import {
  FilterCategory,
  FilterToolbar,
  FilterType,
} from "@app/components/FilterToolbar";
import { useLegacyFilterState } from "@app/hooks/useLegacyFilterState";
import { useQuery } from "@tanstack/react-query";

export interface ITableRowData {
  category: string;
  question: string;
  answer: string;
  applications: Application[];
}

export interface IIdentifiedRisksTableProps {}

export const IdentifiedRisksTable: React.FC<
  IIdentifiedRisksTableProps
> = () => {
  // i18
  const { t } = useTranslation();

  const { allItems: allApplications } = useContext(ApplicationSelectionContext);

  const {
    data: assessmentQuestionRisks,
    refetch: refreshTable,
    error: fetchError,
    isFetching,
  } = useQuery<AssessmentQuestionRisk[]>({
    queryKey: ["assessmentQuestionRisks"],
    queryFn: async () =>
      // (
      //   await getAssessmentIdentifiedRisks(
      //     allApplications.length > 0 ? allApplications.map((f) => f.id!) : []
      //   )
      // ).data,
      [],
    onError: (error) => console.log("error, ", error),
  });

  const tableData: ITableRowData[] = useMemo(() => {
    return (assessmentQuestionRisks || []).map((risk) => ({
      ...risk,
      applications: risk.applications.reduce((prev, current) => {
        const exists = allApplications.find((f) => f.id === current);
        return exists ? [...prev, exists] : [...prev];
      }, [] as Application[]),
    }));
  }, [assessmentQuestionRisks, allApplications]);

  useEffect(() => {
    refreshTable();
  }, [allApplications, refreshTable]);

  // Table
  const columns: ICell[] = [
    {
      title: t("terms.category"),
      transforms: [cellWidth(15)],
      cellTransforms: [breakWord],
      cellFormatters: [],
    },
    {
      title: t("terms.question"),
      transforms: [cellWidth(35)],
      cellTransforms: [breakWord],
      cellFormatters: [],
    },
    {
      title: t("terms.answer"),
      transforms: [cellWidth(35)],
      cellTransforms: [breakWord],
      cellFormatters: [],
    },
    {
      title: t("terms.application(s)"),
      transforms: [cellWidth(15)],
      cellTransforms: [breakWord],
      cellFormatters: [],
    },
  ];
  const filterCategories: FilterCategory<
    ITableRowData,
    "category" | "question" | "answer" | "applications"
  >[] = [
    {
      key: "category",
      title: t("terms.category"),
      type: FilterType.search,
      placeholderText:
        t("actions.filterBy", {
          what: t("terms.category").toLowerCase(),
        }) + "...",
      getItemValue: (item) => {
        return item?.category || "";
      },
    },
    {
      key: "question",
      title: t("terms.question"),
      type: FilterType.search,
      placeholderText:
        t("actions.filterBy", {
          what: t("terms.question").toLowerCase(),
        }) + "...",
      getItemValue: (item) => {
        return item?.question || "";
      },
    },
    {
      key: "answer",
      title: t("terms.answer"),
      type: FilterType.search,
      placeholderText:
        t("actions.filterBy", {
          what: t("terms.answer").toLowerCase(),
        }) + "...",
      getItemValue: (item) => {
        return item?.answer || "";
      },
    },
    {
      key: "applications",
      title: t("terms.name"),
      type: FilterType.search,
      placeholderText:
        t("actions.filterBy", {
          what: t("terms.name").toLowerCase(),
        }) + "...",
      getItemValue: (item) => {
        const applicationNames = item?.applications.map((app) => app.name);
        return applicationNames?.join("") || "";
      },
    },
  ];

  const { filterValues, setFilterValues, filteredItems } = useLegacyFilterState(
    tableData || [],
    filterCategories
  );

  const { currentPageItems, paginationProps } = useLegacyPaginationState(
    filteredItems,
    10
  );

  const rows: IRow[] = [];
  currentPageItems.forEach((item) => {
    rows.push({
      cells: [
        {
          title: item.category,
        },
        {
          title: item.question,
        },
        {
          title: item.answer,
        },
        {
          title: item.applications.map((f) => f.name).join(", "),
        },
      ],
    });
  });

  const handleOnClearAllFilters = () => {
    setFilterValues({});
  };

  return (
    <AppTableWithControls
      paginationProps={paginationProps}
      paginationIdPrefix="identified-risks"
      variant={TableVariant.compact}
      count={filteredItems.length}
      cells={columns}
      rows={rows}
      isLoading={isFetching}
      fetchError={fetchError}
      toolbarClearAllFilters={handleOnClearAllFilters}
      toolbarToggle={
        <FilterToolbar
          filterCategories={filterCategories}
          filterValues={filterValues}
          setFilterValues={setFilterValues}
        />
      }
    />
  );
};
