import React, { useState } from "react";
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
import InProgressIcon from "@patternfly/react-icons/dist/esm/icons/in-progress-icon";

import { useDispatch } from "react-redux";
import { alertActions } from "@app/store/alert";
import { confirmDialogActions } from "@app/store/confirmDialog";

import {
  AppPlaceholder,
  AppTableWithControls,
  ConditionalRender,
  PageHeader,
  KebabDropdown,
} from "@app/shared/components";

import { formatPath, Paths } from "@app/Paths";
import { ApplicationImportSummary } from "@app/api/models";
import { formatDate, getAxiosErrorMessage } from "@app/utils/utils";

import { ImportApplicationsForm } from "../components/import-applications-form";
import { usePaginationState } from "@app/shared/hooks/usePaginationState";
import { AxiosError } from "axios";
import {
  useDeleteImportSummaryMutation,
  useFetchImportSummaries,
} from "@app/queries/imports";
import { useFilterState } from "@app/shared/hooks/useFilterState";
import {
  FilterCategory,
  FilterToolbar,
  FilterType,
} from "@app/shared/components/FilterToolbar/FilterToolbar";
import { useSortState } from "@app/shared/hooks/useSortState";

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

  const { importSummaries, isFetching, fetchError, refetch } =
    useFetchImportSummaries();

  // Application import modal
  const [isApplicationImportModalOpen, setIsApplicationImportModalOpen] =
    useState(false);

  // Delete

  const onDeleteImportSummarySuccess = () => {
    dispatch(confirmDialogActions.processing());
    dispatch(confirmDialogActions.closeDialog());
  };

  const onDeleteImportSummaryError = (error: Error | null) => {
    dispatch(confirmDialogActions.closeDialog());
    if (error) dispatch(alertActions.addDanger(error.message));
  };

  const { mutate: deleteImportSummary } = useDeleteImportSummaryMutation(
    onDeleteImportSummarySuccess,
    onDeleteImportSummaryError
  );

  const filterCategories: FilterCategory<ApplicationImportSummary>[] = [
    {
      key: "filename",
      title: "File Name",
      type: FilterType.search,
      placeholderText: "Filter by filename...",
      getItemValue: (item) => {
        return item?.filename || "";
      },
    },
  ];

  const { filterValues, setFilterValues, filteredItems } = useFilterState(
    importSummaries || [],
    filterCategories
  );

  const getSortValues = (item: ApplicationImportSummary) => [
    "",
    "",
    item?.filename?.toLowerCase() || "",
    "",
    "", // Action column
  ];

  const { sortBy, onSort, sortedItems } = useSortState(
    filteredItems,
    getSortValues
  );

  const { currentPageItems, setPageNumber, paginationProps } =
    usePaginationState(sortedItems, 10);

  // Table
  const columns: ICell[] = [
    {
      title: t("terms.date"),
      transforms: [cellWidth(25)],
    },
    {
      title: t("terms.user"),
      transforms: [cellWidth(15)],
      cellTransforms: [truncate],
    },
    {
      title: t("terms.filename"),
      transforms: [sortable, cellWidth(30)],
      cellTransforms: [truncate],
    },
    { title: t("terms.status"), transforms: [cellWidth(10)] },
    { title: t("terms.accepted"), transforms: [cellWidth(10)] },
    { title: t("terms.rejected"), transforms: [cellWidth(10)] },
  ];

  const rows: IRow[] = [];
  currentPageItems.forEach((item) => {
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
        // t("terms.tag(s)")
        title: t("dialog.title.delete", {
          what: "import summary",
        }),
        titleIconVariant: "warning",
        message: t("dialog.message.delete"),
        confirmBtnVariant: ButtonVariant.danger,
        confirmBtnLabel: t("actions.delete"),
        cancelBtnLabel: t("actions.cancel"),
        onConfirm: () => {
          deleteImportSummary(row.id);
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

  const handleOnClearAllFilters = () => {
    setFilterValues({});
  };

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
          when={isFetching && !(importSummaries || fetchError)}
          then={<AppPlaceholder />}
        >
          <AppTableWithControls
            count={importSummaries ? importSummaries.length : 0}
            paginationProps={paginationProps}
            paginationIdPrefix="manage-imports"
            sortBy={sortBy}
            onSort={onSort}
            cells={columns}
            rows={rows}
            actionResolver={actionResolver}
            isLoading={isFetching}
            loadingVariant="skeleton"
            fetchError={fetchError}
            toolbarClearAllFilters={handleOnClearAllFilters}
            toolbarToggle={
              <FilterToolbar<ApplicationImportSummary>
                filterCategories={filterCategories}
                filterValues={filterValues}
                setFilterValues={setFilterValues}
              />
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
                          key="download-csv-template"
                          component={
                            <a href="/template_application_import.csv" download>
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
            refetch();
          }}
        />
      </Modal>
    </>
  );
};
