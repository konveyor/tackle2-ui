import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  cellWidth,
  ICell,
  IRow,
  sortable,
  TableText,
} from "@patternfly/react-table";

import { AppTableWithControls } from "@app/components/AppTableWithControls";
import { Assessment, ITypeOptions, Question, Section } from "@app/api/models";

import { useLegacyPaginationState } from "@app/hooks/useLegacyPaginationState";
import { useLegacySortState } from "@app/hooks/useLegacySortState";
import {
  FilterCategory,
  FilterToolbar,
  FilterType,
} from "@app/components/FilterToolbar/FilterToolbar";
import { useLegacyFilterState } from "@app/hooks/useLegacyFilterState";
import { useFetchQuestionnaires } from "@app/queries/questionnaires";

interface ITableItem {
  answerValue: string;
  //TODO: fix this once the API is updated
  // riskValue: Risk;
  riskValue: string;
  section: Section;
  question: Question;
}

export interface IApplicationAssessmentSummaryTableProps {
  assessment: Assessment;
}

export const ApplicationAssessmentSummaryTable: React.FC<
  IApplicationAssessmentSummaryTableProps
> = ({ assessment }) => {
  const { t } = useTranslation();
  const { questionnaires } = useFetchQuestionnaires();

  const matchingQuestionnaire = questionnaires.find(
    (questionnaire) => questionnaire.id === assessment?.questionnaire?.id
  );
  if (!matchingQuestionnaire) {
    return null;
  }

  const tableItems: ITableItem[] = useMemo(() => {
    return matchingQuestionnaire.sections
      .slice(0)
      .map((section) => {
        const result: ITableItem[] = section.questions.map((question) => {
          const checkedOption = question.answers.find(
            (q) => q.selected === true
          );
          const item: ITableItem = {
            answerValue: checkedOption ? checkedOption.text : "",
            riskValue: checkedOption ? checkedOption.risk : "unknown",
            section,
            question,
          };
          return item;
        });
        return result;
      })
      .flatMap((f) => f)
      .sort((a, b) => {
        if (a.section.order !== b.section.order) {
          return a.section.order - b.section.order;
        } else {
          return a.question.order - b.question.order;
        }
      });
  }, [assessment]);
  const typeOptions: Array<ITypeOptions> = [
    { key: "green", value: "Low" },
    { key: "yellow", value: "Medium" },
    { key: "red", value: "High" },
    { key: "unknown", value: "Unknown" },
  ];

  const filterCategories: FilterCategory<ITableItem, "riskValue">[] = [
    {
      categoryKey: "riskValue",
      title: "Risk",
      type: FilterType.select,
      placeholderText: "Filter by name...",
      getItemValue: (item) => {
        return item.riskValue || "";
      },
      selectOptions: typeOptions.map(({ key, value }) => ({
        value: key,
        label: value,
      })),
    },
  ];

  const { filterValues, setFilterValues, filteredItems } = useLegacyFilterState(
    tableItems || [],
    filterCategories
  );
  const getSortValues = (tableItem: ITableItem) => [
    tableItem.section.name || "",
    tableItem.question.text || "",
    tableItem.answerValue || "",
    //TODO: fix this once the API is updated
    // RISK_LIST[tableItem.riskValue].sortFactor || "",
  ];

  const { sortBy, onSort, sortedItems } = useLegacySortState(
    filteredItems,
    getSortValues
  );
  const handleOnClearAllFilters = () => {
    setFilterValues({});
  };

  const { currentPageItems, setPageNumber, paginationProps } =
    useLegacyPaginationState(sortedItems, 10);

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
            <TableText wrapModifier="truncate">{item.section.name}</TableText>
          ),
        },
        {
          title: (
            <TableText wrapModifier="truncate">{item.question.text}</TableText>
          ),
        },
        {
          title: (
            <TableText wrapModifier="truncate">{item.answerValue}</TableText>
          ),
        },
        {
          // title: <RiskLabel risk={item.riskValue} />,
          title: "Risk component will go here",
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
        <FilterToolbar
          filterCategories={filterCategories}
          filterValues={filterValues}
          setFilterValues={setFilterValues}
        />
      }
    />
  );
};
