import React, { useContext } from "react";
import { Table } from "@patternfly/react-table";

import { useTranslation } from "react-i18next";
import {
  breakWord,
  cellWidth,
  ICell,
  IRow,
  TableVariant,
} from "@patternfly/react-table";

import { Application } from "@app/api/models";
import { ApplicationSelectionContext } from "../../application-selection-context";
import { useLegacyPaginationState } from "@app/hooks/useLegacyPaginationState";
import { FilterCategory, FilterType } from "@app/components/FilterToolbar";
import { useLegacyFilterState } from "@app/hooks/useLegacyFilterState";
import { useFetchAssessments } from "@app/queries/assessments";

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
  const { assessments } = useFetchAssessments();

  const tableData: any = [];
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
    <Table
      aria-label={`Identified Risks Table`}
      variant={TableVariant.compact}
    ></Table>
  );
};
