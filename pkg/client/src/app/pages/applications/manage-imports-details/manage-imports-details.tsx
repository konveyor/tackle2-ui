import React, { useCallback, useEffect, useMemo } from "react";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { saveAs } from "file-saver";

import {
  Button,
  ButtonVariant,
  PageSection,
  ToolbarGroup,
  ToolbarItem,
} from "@patternfly/react-core";
import { cellWidth, ICell, IRow, truncate } from "@patternfly/react-table";

import { useDispatch } from "react-redux";
import { alertActions } from "@app/store/alert";

import { useFetch, useTableControls } from "@app/shared/hooks";
import {
  AppPlaceholder,
  AppTableWithControls,
  ConditionalRender,
  PageHeader,
} from "@app/shared/components";

import { ImportSummaryRoute, Paths } from "@app/Paths";
import {
  getApplicationImport,
  getApplicationImportSummaryById,
  getApplicationSummaryCSV,
} from "@app/api/rest";
import {
  ApplicationImportPage,
  ApplicationImportSummary,
} from "@app/api/models";
import { applicationImportPageMapper } from "@app/api/apiUtils";
import { getAxiosErrorMessage } from "@app/utils/utils";

const ENTITY_FIELD = "entity";

export const ManageImportsDetails: React.FC = () => {
  // i18
  const { t } = useTranslation();

  // Router
  const { importId } = useParams<ImportSummaryRoute>();

  // Redux
  const dispatch = useDispatch();

  const fetchApplicationImportSummary = useCallback(() => {
    return getApplicationImportSummaryById(importId);
  }, [importId]);

  const {
    data: applicationImportSummary,
    requestFetch: refreshApplicationImportSummary,
  } = useFetch<ApplicationImportSummary>({
    defaultIsFetching: true,
    onFetch: fetchApplicationImportSummary,
  });

  useEffect(() => {
    refreshApplicationImportSummary();
  }, [refreshApplicationImportSummary]);

  // Table data
  const {
    paginationQuery,
    sortByQuery,
    handlePaginationChange,
    handleSortChange,
  } = useTableControls();

  const fetchApplicationImports = useCallback(() => {
    return getApplicationImport(
      { summaryId: importId, isValid: false },
      paginationQuery
    );
  }, [importId, paginationQuery]);

  const {
    data: page,
    isFetching,
    fetchError,
    requestFetch: refreshTable,
  } = useFetch<ApplicationImportPage>({
    defaultIsFetching: true,
    onFetch: fetchApplicationImports,
  });

  const imports = useMemo(() => {
    return page ? applicationImportPageMapper(page) : undefined;
  }, [page]);

  useEffect(() => {
    refreshTable();
  }, [paginationQuery, sortByQuery, refreshTable]);

  // Table
  const columns: ICell[] = [
    {
      title: t("terms.application"),
      transforms: [cellWidth(30)],
      cellTransforms: [truncate],
    },
    {
      title: t("terms.message"),
      transforms: [cellWidth(70)],
      cellTransforms: [truncate],
    },
  ];

  const rows: IRow[] = [];
  imports?.data.forEach((item) => {
    rows.push({
      [ENTITY_FIELD]: item,
      cells: [
        {
          title: item["Application Name"],
        },
        {
          title: item.errorMessage,
        },
      ],
    });
  });

  //

  const exportCSV = () => {
    getApplicationSummaryCSV(importId)
      .then((response) => {
        const fileName = applicationImportSummary?.filename || "file.csv";
        saveAs(new Blob([response.data]), fileName);
      })
      .catch((error) => {
        dispatch(alertActions.addDanger(getAxiosErrorMessage(error)));
      });
  };

  return (
    <>
      <PageSection variant="light">
        <PageHeader
          title={t("terms.errorReport")}
          breadcrumbs={[
            {
              title: t("terms.applications"),
              path: Paths.applications,
            },
            {
              title: t("terms.imports"),
              path: Paths.applicationsImports,
            },
            {
              title: applicationImportSummary?.filename || "",
              path: "",
            },
          ]}
          menuActions={[]}
        />
      </PageSection>
      <PageSection>
        <ConditionalRender
          when={isFetching && !(imports || fetchError)}
          then={<AppPlaceholder />}
        >
          <AppTableWithControls
            count={imports ? imports.meta.count : 0}
            pagination={paginationQuery}
            sortBy={sortByQuery}
            onPaginationChange={handlePaginationChange}
            onSort={handleSortChange}
            filtersApplied={false}
            cells={columns}
            rows={rows}
            isLoading={isFetching}
            loadingVariant="skeleton"
            fetchError={fetchError}
            toolbarActions={
              <>
                <ToolbarGroup variant="button-group">
                  <ToolbarItem>
                    <Button
                      type="button"
                      aria-label="export-csv"
                      variant={ButtonVariant.primary}
                      onClick={exportCSV}
                    >
                      {t("actions.export")}
                    </Button>
                  </ToolbarItem>
                </ToolbarGroup>
              </>
            }
          />
        </ConditionalRender>
      </PageSection>
    </>
  );
};
