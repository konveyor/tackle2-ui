import React, { useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { ToolbarChip } from "@patternfly/react-core";
import {
  cellWidth,
  ICell,
  IRow,
  sortable,
  TableText,
} from "@patternfly/react-table";

import {
  AppTableToolbarToggleGroup,
  AppTableWithControls,
  RiskLabel,
} from "@app/shared/components";
import {
  useToolbarFilter,
  useTableControls,
  useTableFilter,
} from "@app/shared/hooks";

import { RISK_LIST } from "@app/Constants";
import {
  Assessment,
  Question,
  QuestionnaireCategory,
  Risk,
} from "@app/api/models";

import { SelectRiskFilter } from "./components/select-risk-filter";

enum FilterKey {
  RISK = "risk",
}

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

  // Filters

  const filters = [
    {
      key: FilterKey.RISK,
      name: t("terms.risk"),
    },
  ];

  const {
    filters: filtersValue,
    isPresent: areFiltersPresent,
    setFilter,
    clearAllFilters,
  } = useToolbarFilter<ToolbarChip>();

  // Table

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

  const compareToByColumn = useCallback(
    (a: ITableItem, b: ITableItem, columnIndex?: number) => {
      switch (columnIndex) {
        case 3: // Risk
          return (
            RISK_LIST[a.riskValue].sortFactor -
            RISK_LIST[b.riskValue].sortFactor
          );
        default:
          return 0;
      }
    },
    []
  );

  const filterItem = useCallback(
    (item: ITableItem) => {
      let result: boolean = true;

      const risks = filtersValue.get(FilterKey.RISK)?.map((f) => f.key);
      if (risks && risks.length > 0) {
        result = risks.some((f) => f === item.riskValue);
      }

      return result;
    },
    [filtersValue]
  );

  const {
    paginationQuery: pagination,
    sortByQuery: sortBy,
    handlePaginationChange: onPaginationChange,
    handleSortChange: onSort,
  } = useTableControls({ paginationQuery: { page: 1, perPage: 50 } });

  const { pageItems, filteredItems } = useTableFilter<ITableItem>({
    items: tableItems,
    sortBy,
    compareToByColumn,
    pagination,
    filterItem,
  });

  useEffect(() => {
    onPaginationChange({ page: 1 });
  }, [filtersValue, onPaginationChange]);

  // Table

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
  pageItems.forEach((item) => {
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
      pagination={pagination}
      sortBy={sortBy}
      onPaginationChange={onPaginationChange}
      onSort={onSort}
      cells={columns}
      rows={rows}
      isLoading={false}
      filtersApplied={areFiltersPresent}
      toolbarClearAllFilters={clearAllFilters}
      toolbarToggle={
        <AppTableToolbarToggleGroup
          categories={filters}
          chips={filtersValue}
          onChange={(key, value) => {
            setFilter(key, value as ToolbarChip[]);
          }}
        >
          <SelectRiskFilter
            value={filtersValue.get(FilterKey.RISK)}
            onChange={(values) => setFilter(FilterKey.RISK, values)}
          />
        </AppTableToolbarToggleGroup>
      }
    />
  );
};
