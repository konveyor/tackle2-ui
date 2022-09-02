import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  cellWidth,
  ICell,
  IRow,
  sortable,
  TableText,
} from "@patternfly/react-table";

import { AppTableWithControls, RiskLabel } from "@app/shared/components";
import { RISK_LIST } from "@app/Constants";
import {
  Assessment,
  ITypeOptions,
  Question,
  QuestionnaireCategory,
  Risk,
} from "@app/api/models";

import { usePaginationState } from "@app/shared/hooks/usePaginationState";
import { useSortState } from "@app/shared/hooks/useSortState";
import {
  FilterCategory,
  FilterToolbar,
  FilterType,
} from "@app/shared/components/FilterToolbar/FilterToolbar";
import { useFilterState } from "@app/shared/hooks/useFilterState";

interface ITableItem {
  answerValue: string;
  riskValue: Risk;
  category: QuestionnaireCategory;
  question: Question;
}

export interface IApplicationAssessmentSummaryTableProps {
  assessment: Assessment;
}

export const ApplicationAssessmentSummaryTable: React.FC<
  IApplicationAssessmentSummaryTableProps
> = ({ assessment }) => {
  const { t } = useTranslation();

  const tableItems: ITableItem[] = useMemo(() => {
    return assessment.questionnaire.categories
      .slice(0)
      .map((category) => {
        const result: ITableItem[] = category.questions.map((question) => {
          const checkedOption = question.options.find(
            (q) => q.checked === true
          );
          const item: ITableItem = {
            answerValue: checkedOption ? checkedOption.option : "",
            riskValue: checkedOption ? checkedOption.risk : "UNKNOWN",
            category,
            question,
          };
          return item;
        });
        return result;
      })
      .flatMap((f) => f)
      .sort((a, b) => {
        if (a.category.order !== b.category.order) {
          return a.category.order - b.category.order;
        } else {
          return a.question.order - b.question.order;
        }
      });
  }, [assessment]);
  const typeOptions: Array<ITypeOptions> = [
    { key: "GREEN", value: "Low" },
    { key: "AMBER", value: "Medium" },
    { key: "RED", value: "High" },
    { key: "UNKNOWN", value: "Unknown" },
  ];

  const filterCategories: FilterCategory<ITableItem>[] = [
    {
      key: "riskValue",
      title: "Risk",
      type: FilterType.select,
      placeholderText: "Filter by name...",
      getItemValue: (item: ITableItem) => {
        return item.riskValue || "";
      },
      selectOptions: typeOptions,
    },
  ];

  const { filterValues, setFilterValues, filteredItems } = useFilterState(
    tableItems || [],
    filterCategories
  );
  const getSortValues = (tableItem: ITableItem) => [
    tableItem.category.title || "",
    tableItem.question.question || "",
    tableItem.answerValue || "",
    RISK_LIST[tableItem.riskValue].sortFactor || "",
  ];

  const { sortBy, onSort, sortedItems } = useSortState(
    filteredItems,
    getSortValues
  );
  const handleOnClearAllFilters = () => {
    setFilterValues({});
  };

  const { currentPageItems, setPageNumber, paginationProps } =
    usePaginationState(sortedItems, 10);

  const columns: ICell[] = [
    {
      title: t("terms.category"),
      transforms: [cellWidth(20)],
      cellFormatters: [],
    },
    {
      title: t("terms.question"),
      transforms: [cellWidth(35)],
      cellFormatters: [],
    },
    {
      title: t("terms.answer"),
      transforms: [cellWidth(35)],
      cellFormatters: [],
    },
    {
      title: t("terms.risk"),
      transforms: [cellWidth(10), sortable],
      cellFormatters: [],
    },
  ];

  const rows: IRow[] = [];
  currentPageItems.forEach((item) => {
    rows.push({
      cells: [
        {
          title: (
            <TableText wrapModifier="truncate">{item.category.title}</TableText>
          ),
        },
        {
          title: (
            <TableText wrapModifier="truncate">
              {item.question.question}
            </TableText>
          ),
        },
        {
          title: (
            <TableText wrapModifier="truncate">{item.answerValue}</TableText>
          ),
        },
        {
          title: <RiskLabel risk={item.riskValue} />,
        },
      ],
    });
  });

  return (
    <AppTableWithControls
      count={filteredItems.length}
      sortBy={sortBy}
      onSort={onSort}
      cells={columns}
      rows={rows}
      isLoading={false}
      paginationProps={paginationProps}
      paginationIdPrefix="app-assessment-summary"
      toolbarClearAllFilters={handleOnClearAllFilters}
      toolbarToggle={
        <FilterToolbar<ITableItem>
          filterCategories={filterCategories}
          filterValues={filterValues}
          setFilterValues={setFilterValues}
        />
      }
    />
  );
};
