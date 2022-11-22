import React from "react";
import { useParams } from "react-router-dom";
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

import {
  AppPlaceholder,
  AppTableWithControls,
  ConditionalRender,
  PageHeader,
} from "@app/shared/components";
import { ImportSummaryRoute, Paths } from "@app/Paths";
import { getApplicationSummaryCSV } from "@app/api/rest";
import { ApplicationImport } from "@app/api/models";
import { getAxiosErrorMessage } from "@app/utils/utils";
import { usePaginationState } from "@app/shared/hooks/usePaginationState";
import {
  useFetchImports,
  useFetchImportSummaryByID,
} from "@app/queries/imports";
import {
  FilterCategory,
  FilterType,
} from "@app/shared/components/FilterToolbar/FilterToolbar";
import { useFilterState } from "@app/shared/hooks/useFilterState";
import { useSortState } from "@app/shared/hooks/useSortState";
import { NotificationsContext } from "@app/shared/notifications-context";

const ENTITY_FIELD = "entity";

export const ManageImportsDetails: React.FC = () => {
  // i18
  const { t } = useTranslation();

  // Router
  const { importId } = useParams<ImportSummaryRoute>();

  const { pushNotification } = React.useContext(NotificationsContext);

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

  const { imports, isFetching, fetchError } = useFetchImports(
    parseInt(importId),
    false
  );

  const { importSummary } = useFetchImportSummaryByID(importId);

  const rows: IRow[] = [];
  imports?.forEach((item) => {
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
        const fileName = importSummary?.filename || "file.csv";
        saveAs(new Blob([response.data]), fileName);
      })
      .catch((error) => {
        pushNotification({
          title: getAxiosErrorMessage(error),
          variant: "danger",
        });
      });
  };

  const filterCategories: FilterCategory<ApplicationImport>[] = [
    {
      key: "Application Name",
      title: "Application Name",
      type: FilterType.search,
      placeholderText: "Filter by application name...",
      getItemValue: (item) => {
        return item["Application Name"] || "";
      },
    },
  ];

  const { filterValues, setFilterValues, filteredItems } = useFilterState(
    imports || [],
    filterCategories
  );
  const handleOnClearAllFilters = () => {
    setFilterValues({});
  };

  const getSortValues = (item: ApplicationImport) => [
    item?.["Application Name"] || "",
    "", // Action column
  ];

  const { sortBy, onSort, sortedItems } = useSortState(
    filteredItems,
    getSortValues
  );

  const { currentPageItems, setPageNumber, paginationProps } =
    usePaginationState(sortedItems, 10);

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
              title: importSummary?.filename || "",
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
            count={imports ? imports.length : 0}
            paginationProps={paginationProps}
            paginationIdPrefix="manage-imports-details"
            sortBy={sortBy}
            onSort={onSort}
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
