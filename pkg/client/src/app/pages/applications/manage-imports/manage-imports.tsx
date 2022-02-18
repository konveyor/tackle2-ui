import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useHistory } from "react-router";
import { useTranslation } from "react-i18next";
import { StatusIcon } from "@konveyor/lib-ui";

import {
  Button,
  ButtonVariant,
  DropdownItem,
  Flex,
  FlexItem,
  Modal,
  PageSection,
  Popover,
  ToolbarChip,
  ToolbarGroup,
  ToolbarItem,
} from "@patternfly/react-core";
import {
  cellWidth,
  IAction,
  ICell,
  IRow,
  IRowData,
  ISeparator,
  sortable,
  truncate,
} from "@patternfly/react-table";
import { InProgressIcon } from "@patternfly/react-icons/dist/esm/icons/in-progress-icon";

import { useDispatch } from "react-redux";
import { alertActions } from "@app/store/alert";
import { confirmDialogActions } from "@app/store/confirmDialog";

import {
  useApplicationToolbarFilter,
  useDelete,
  useFetch,
  useTableControls,
} from "@app/shared/hooks";
import {
  AppPlaceholder,
  AppTableToolbarToggleGroup,
  AppTableWithControls,
  ConditionalRender,
  InputTextFilter,
  PageHeader,
  ToolbarSearchFilter,
  KebabDropdown,
} from "@app/shared/components";

import { formatPath, Paths } from "@app/Paths";
import {
  ApplicationImportSummarySortBy,
  ApplicationImportSummarySortByQuery,
  deleteApplicationImportSummary,
  getApplicationImportSummary,
} from "@app/api/rest";
import {
  ApplicationImportSummary,
  ApplicationImportSummaryPage,
  SortByQuery,
} from "@app/api/models";
import { applicationImportSummaryPageMapper } from "@app/api/apiUtils";
import { formatDate, getAxiosErrorMessage } from "@app/utils/utils";

import { ImportApplicationsForm } from "../applicationsTable/components/import-applications-form";

export enum FilterKey {
  FILE_NAME = "filename",
}

const toSortByQuery = (
  sortBy?: SortByQuery
): ApplicationImportSummarySortByQuery | undefined => {
  if (!sortBy) {
    return undefined;
  }

  let field: ApplicationImportSummarySortBy;
  switch (sortBy.index) {
    case 0:
      field = ApplicationImportSummarySortBy.DATE;
      break;
    case 1:
      field = ApplicationImportSummarySortBy.USER;
      break;
    case 2:
      field = ApplicationImportSummarySortBy.FILE_NAME;
      break;
    case 3:
      field = ApplicationImportSummarySortBy.STATUS;
      break;
    default:
      return undefined;
  }

  return {
    field,
    direction: sortBy.direction,
  };
};

const ENTITY_FIELD = "entity";

const getRow = (rowData: IRowData): ApplicationImportSummary => {
  return rowData[ENTITY_FIELD];
};

export const ManageImports: React.FC = () => {
  // i18
  const { t } = useTranslation();

  // Redux
  const dispatch = useDispatch();

  // Router
  const history = useHistory();

  // Application import modal
  const [isApplicationImportModalOpen, setIsApplicationImportModalOpen] =
    useState(false);

  // Delete
  const { requestDelete: requestDeleteApplication } =
    useDelete<ApplicationImportSummary>({
      onDelete: (t: ApplicationImportSummary) =>
        deleteApplicationImportSummary(t.id),
    });

  // Toolbar filters
  const {
    filters: filtersValue,
    isPresent: areFiltersPresent,
    addFilter,
    setFilter,
    clearAllFilters,
  } = useApplicationToolbarFilter();

  // Table data
  const {
    paginationQuery,
    sortByQuery,
    handlePaginationChange,
    handleSortChange,
  } = useTableControls({ sortByQuery: { index: 0, direction: "desc" } });

  const fetchApplicationImports = useCallback(() => {
    const filenameVal = filtersValue.get(FilterKey.FILE_NAME);
    return getApplicationImportSummary(
      {
        filename: filenameVal?.map((f) => f.key),
      },
      paginationQuery,
      toSortByQuery(sortByQuery)
    );
  }, [filtersValue, paginationQuery, sortByQuery]);

  const {
    data: page,
    isFetching,
    fetchError,
    requestFetch: refreshTable,
  } = useFetch<ApplicationImportSummaryPage>({
    defaultIsFetching: true,
    onFetch: fetchApplicationImports,
  });

  const imports = useMemo(() => {
    return page ? applicationImportSummaryPageMapper(page) : undefined;
  }, [page]);

  useEffect(() => {
    refreshTable();
  }, [filtersValue, paginationQuery, sortByQuery, refreshTable]);

  // Table
  const columns: ICell[] = [
    {
      title: t("terms.date"),
      transforms: [sortable, cellWidth(25)],
    },
    {
      title: t("terms.user"),
      transforms: [sortable, cellWidth(15)],
      cellTransforms: [truncate],
    },
    {
      title: t("terms.filename"),
      transforms: [sortable, cellWidth(30)],
      cellTransforms: [truncate],
    },
    { title: t("terms.status"), transforms: [sortable, cellWidth(10)] },
    { title: t("terms.accepted"), transforms: [cellWidth(10)] },
    { title: t("terms.rejected"), transforms: [cellWidth(10)] },
  ];

  const rows: IRow[] = [];
  imports?.data.forEach((item) => {
    let status;
    if (item.importStatus === "Completed") {
      status = <StatusIcon status="Ok" label={t("terms.completed")} />;
    } else if (item.importStatus === "In Progress") {
      status = (
        <Flex
          spaceItems={{ default: "spaceItemsSm" }}
          alignItems={{ default: "alignItemsCenter" }}
          flexWrap={{ default: "nowrap" }}
          style={{ whiteSpace: "nowrap" }}
        >
          <FlexItem>
            <InProgressIcon />
          </FlexItem>
          <FlexItem>{t("terms.inProgress")}</FlexItem>
        </Flex>
      );
    } else {
      status = (
        <StatusIcon
          status="Error"
          label={
            <Popover
              position="right"
              bodyContent={
                <div>{t("message.importErrorCheckDocumentation")}</div>
              }
              footerContent={
                <div>
                  <a
                    href="https://tackle-docs.konveyor.io/documentation/doc-installing-and-using-tackle/master/index.html#importing-applications_tackle"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t("actions.checkDocumentation")}
                  </a>
                </div>
              }
            >
              <Button variant={ButtonVariant.link} isInline>
                {t("terms.error")}
              </Button>
            </Popover>
          }
        />
      );
    }

    rows.push({
      [ENTITY_FIELD]: item,
      cells: [
        {
          title: item.importTime ? formatDate(new Date(item.importTime)) : "",
        },
        {
          title: item.createUser,
        },
        {
          title: item.filename,
        },
        {
          title: status,
        },
        {
          title: item.validCount,
        },
        {
          title: item.invalidCount,
        },
      ],
    });
  });

  const actionResolver = (rowData: IRowData): (IAction | ISeparator)[] => {
    const row: ApplicationImportSummary = getRow(rowData);
    if (!row) {
      return [];
    }

    const actions: (IAction | ISeparator)[] = [];
    actions.push({
      title: t("actions.delete"),
      onClick: (
        event: React.MouseEvent,
        rowIndex: number,
        rowData: IRowData
      ) => {
        const row: ApplicationImportSummary = getRow(rowData);
        deleteRow(row);
      },
    });

    if (row.importStatus === "Completed" && row.invalidCount > 0) {
      actions.push({
        title: t("actions.viewErrorReport"),
        onClick: (
          event: React.MouseEvent,
          rowIndex: number,
          rowData: IRowData
        ) => {
          const row: ApplicationImportSummary = getRow(rowData);
          viewRowDetails(row);
        },
      });
    }

    return actions;
  };

  // Row actions
  const deleteRow = (row: ApplicationImportSummary) => {
    dispatch(
      confirmDialogActions.openDialog({
        // t("terms.summaryImport")
        title: t("dialog.title.delete", {
          what: t("terms.summaryImport").toLowerCase(),
        }),
        titleIconVariant: "warning",
        message: t("dialog.message.delete"),
        confirmBtnVariant: ButtonVariant.danger,
        confirmBtnLabel: t("actions.delete"),
        cancelBtnLabel: t("actions.cancel"),
        onConfirm: () => {
          dispatch(confirmDialogActions.processing());
          requestDeleteApplication(
            row,
            () => {
              dispatch(confirmDialogActions.closeDialog());
              if (imports?.data.length === 1) {
                handlePaginationChange({ page: paginationQuery.page - 1 });
              } else {
                refreshTable();
              }
            },
            (error) => {
              dispatch(confirmDialogActions.closeDialog());
              dispatch(alertActions.addDanger(getAxiosErrorMessage(error)));
            }
          );
        },
      })
    );
  };

  const viewRowDetails = (row: ApplicationImportSummary) => {
    history.push(
      formatPath(Paths.applicationsImportsDetails, {
        importId: row.id,
      })
    );
  };

  // Filter components
  const filterOptions = [
    {
      key: FilterKey.FILE_NAME,
      name: t("terms.filename"),
      input: (
        <InputTextFilter
          onApplyFilter={(filterText) => {
            addFilter(FilterKey.FILE_NAME, {
              key: filterText,
              node: filterText,
            });
          }}
        />
      ),
    },
  ];

  return (
    <>
      <PageSection variant="light">
        <PageHeader
          title={t("terms.applicationImports")}
          breadcrumbs={[
            {
              title: t("terms.applications"),
              path: Paths.applications,
            },
            {
              title: t("terms.applicationImports"),
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
            cells={columns}
            rows={rows}
            actionResolver={actionResolver}
            isLoading={isFetching}
            loadingVariant="skeleton"
            fetchError={fetchError}
            toolbarClearAllFilters={clearAllFilters}
            filtersApplied={areFiltersPresent}
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
            toolbarActions={
              <>
                <ToolbarGroup variant="button-group">
                  <ToolbarItem>
                    <Button
                      type="button"
                      aria-label="import-applications"
                      variant={ButtonVariant.primary}
                      onClick={() => setIsApplicationImportModalOpen(true)}
                    >
                      {t("actions.import")}
                    </Button>
                  </ToolbarItem>
                  <ToolbarItem>
                    <KebabDropdown
                      dropdownItems={[
                        <DropdownItem
                          key="download-csv-sample"
                          component={
                            <a href="/sample_application_import.csv" download>
                              {t("actions.downloadCsvTemplate")}
                            </a>
                          }
                        />,
                      ]}
                    />
                  </ToolbarItem>
                </ToolbarGroup>
              </>
            }
          />
        </ConditionalRender>
      </PageSection>

      <Modal
        isOpen={isApplicationImportModalOpen}
        variant="medium"
        title={t("dialog.title.importApplicationFile")}
        onClose={() => setIsApplicationImportModalOpen((current) => !current)}
      >
        <ImportApplicationsForm
          onSaved={() => {
            setIsApplicationImportModalOpen(false);
            refreshTable();
          }}
        />
      </Modal>
    </>
  );
};
