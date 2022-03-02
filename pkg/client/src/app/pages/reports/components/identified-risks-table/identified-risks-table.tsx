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

import { useFetch } from "@app/shared/hooks";
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
  assessmentQuestionRisks?.forEach((item) => {
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
          title: item.applications.map((f) => f),
        },
      ],
    });
  });

  return (
    <AppTableWithControls
      variant={TableVariant.compact}
      cells={columns}
      rows={rows}
      isLoading={isFetching}
      fetchError={fetchError}
    />
  );
};
