import React, { useCallback, useContext, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { ToolbarChip } from "@patternfly/react-core";
import {
  breakWord,
  cellWidth,
  ICell,
  IRow,
  TableVariant,
} from "@patternfly/react-table";

import {
  useApplicationToolbarFilter,
  useFetch,
  useTableControls,
  useTableFilter,
} from "@app/shared/hooks";
import {
  AppTableToolbarToggleGroup,
  AppTableWithControls,
  InputTextFilter,
  ToolbarSearchFilter,
} from "@app/shared/components";

import { Application, AssessmentQuestionRisk } from "@app/api/models";
import { getAssessmentIdentifiedRisks } from "@app/api/rest";

import { ApplicationSelectionContext } from "../../application-selection-context";

export enum FilterKey {
  APPLICATION_NAME = "application_name",
  CATEGORY = "category",
  QUESTION = "question",
  ANSWER = "answer",
}

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

  // Context
  const { selectedItems: applications } = useContext(
    ApplicationSelectionContext
  );

  // Toolbar filters data
  const {
    filters: filtersValue,
    isPresent: areFiltersPresent,
    addFilter,
    setFilter,
    clearAllFilters,
  } = useApplicationToolbarFilter();

  // Table data
  const fetchTableData = useCallback(() => {
    if (applications.length > 0) {
      return getAssessmentIdentifiedRisks(applications.map((f) => f.id!)).then(
        ({ data }) => data
      );
    } else {
      return Promise.resolve([]);
    }
  }, [applications]);

  const {
    data: assessmentQuestionRisks,
    isFetching,
    fetchError,
    requestFetch: refreshTable,
  } = useFetch<AssessmentQuestionRisk[]>({
    defaultIsFetching: true,
    onFetchPromise: fetchTableData,
  });

  const tableData: ITableRowData[] = useMemo(() => {
    return (assessmentQuestionRisks || []).map((risk) => ({
      ...risk,
      applications: risk.applications.reduce((prev, current) => {
        const exists = applications.find((f) => f.id === current);
        return exists ? [...prev, exists] : [...prev];
      }, [] as Application[]),
    }));
  }, [assessmentQuestionRisks, applications]);

  useEffect(() => {
    refreshTable();
  }, [applications, refreshTable]);

  // Table pagination
  const {
    paginationQuery: pagination,
    sortByQuery: sortBy,
    handlePaginationChange: onPaginationChange,
    handleSortChange: onSort,
  } = useTableControls({
    paginationQuery: { page: 1, perPage: 50 },
  });

  const compareToByColumn = useCallback(
    (a: ITableRowData, b: ITableRowData, columnIndex?: number) => 0,
    []
  );

  const filterItem = useCallback(
    (item: ITableRowData) => {
      // Application name
      let applicationNameResult: boolean = true;
      const applicationNameFiltersText = (
        filtersValue.get(FilterKey.APPLICATION_NAME) || []
      ).map((f) => f.key);
      if (applicationNameFiltersText.length > 0) {
        applicationNameResult = applicationNameFiltersText.some((filterText) =>
          item.applications.some(
            (application) =>
              application.name
                .toLowerCase()
                .indexOf(filterText.toLowerCase()) !== -1
          )
        );
      }

      // Category
      let categoryResult: boolean = true;
      const categoryFiltersText = (
        filtersValue.get(FilterKey.CATEGORY) || []
      ).map((f) => f.key);
      if (categoryFiltersText.length > 0) {
        categoryResult = categoryFiltersText.some((filterText) => {
          return (
            item.category.toLowerCase().indexOf(filterText.toLowerCase()) !== -1
          );
        });
      }

      // Question
      let questionResult: boolean = true;
      const questionFiltersText = (
        filtersValue.get(FilterKey.QUESTION) || []
      ).map((f) => f.key);
      if (questionFiltersText.length > 0) {
        questionResult = questionFiltersText.some((filterText) => {
          return (
            item.question.toLowerCase().indexOf(filterText.toLowerCase()) !== -1
          );
        });
      }

      // Answer
      let answerResult: boolean = true;
      const answerFiltersText = (filtersValue.get(FilterKey.ANSWER) || []).map(
        (f) => f.key
      );
      if (answerFiltersText.length > 0) {
        answerResult = answerFiltersText.some((filterText) => {
          return (
            item.answer.toLowerCase().indexOf(filterText.toLowerCase()) !== -1
          );
        });
      }

      return (
        applicationNameResult &&
        categoryResult &&
        questionResult &&
        answerResult
      );
    },
    [filtersValue]
  );

  const { pageItems, filteredItems } = useTableFilter<ITableRowData>({
    items: tableData,
    sortBy,
    compareToByColumn,
    pagination,
    filterItem,
  });

  // Filter components
  const filterOptions = [
    {
      key: FilterKey.APPLICATION_NAME,
      name: t("terms.application"),
      input: (
        <InputTextFilter
          onApplyFilter={(filterText) => {
            addFilter(FilterKey.APPLICATION_NAME, {
              key: filterText,
              node: filterText,
            });
          }}
        />
      ),
    },
    {
      key: FilterKey.CATEGORY,
      name: t("terms.category"),
      input: (
        <InputTextFilter
          onApplyFilter={(filterText) => {
            addFilter(FilterKey.CATEGORY, {
              key: filterText,
              node: filterText,
            });
          }}
        />
      ),
    },
    {
      key: FilterKey.QUESTION,
      name: t("terms.question"),
      input: (
        <InputTextFilter
          onApplyFilter={(filterText) => {
            addFilter(FilterKey.QUESTION, {
              key: filterText,
              node: filterText,
            });
          }}
        />
      ),
    },
    {
      key: FilterKey.ANSWER,
      name: t("terms.answer"),
      input: (
        <InputTextFilter
          onApplyFilter={(filterText) => {
            addFilter(FilterKey.ANSWER, {
              key: filterText,
              node: filterText,
            });
          }}
        />
      ),
    },
  ];

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

  const rows: IRow[] = [];
  pageItems.forEach((item) => {
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

  return (
    <AppTableWithControls
      variant={TableVariant.compact}
      count={filteredItems.length}
      pagination={pagination}
      sortBy={sortBy}
      onPaginationChange={onPaginationChange}
      onSort={onSort}
      cells={columns}
      rows={rows}
      isLoading={isFetching}
      fetchError={fetchError}
      filtersApplied={areFiltersPresent}
      toolbarClearAllFilters={clearAllFilters}
      toolbarToggle={
        <AppTableToolbarToggleGroup
          categories={filterOptions.map((f) => ({
            key: f.key,
            name: f.name,
          }))}
          chips={filtersValue}
          onChange={(key, value) => {
            setFilter(key as FilterKey, value as ToolbarChip[]);
          }}
        >
          <ToolbarSearchFilter filters={filterOptions} />
        </AppTableToolbarToggleGroup>
      }
    />
  );
};
