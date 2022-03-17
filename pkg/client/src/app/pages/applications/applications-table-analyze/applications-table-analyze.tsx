import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useHistory } from "react-router-dom";
import { AxiosResponse } from "axios";
import { useTranslation } from "react-i18next";
import { useSelectionState } from "@konveyor/lib-ui";
import {
  Button,
  ButtonVariant,
  DropdownItem,
  Modal,
  ToolbarGroup,
  ToolbarItem,
} from "@patternfly/react-core";

import {
  cellWidth,
  expandable,
  IAction,
  ICell,
  IExtraData,
  IRow,
  IRowData,
  ISeparator,
  sortable,
  TableText,
} from "@patternfly/react-table";
import { TagIcon } from "@patternfly/react-icons/dist/esm/icons/tag-icon";
import { PencilAltIcon } from "@patternfly/react-icons/dist/esm/icons/pencil-alt-icon";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@app/store/rootReducer";
import { alertActions } from "@app/store/alert";
import { confirmDialogActions } from "@app/store/confirmDialog";
import { unknownTagsSelectors } from "@app/store/unknownTags";
import { bulkCopySelectors } from "@app/store/bulkCopy";
import {
  AppPlaceholder,
  AppTableWithControls,
  ConditionalRender,
  NoDataEmptyState,
  KebabDropdown,
} from "@app/shared/components";
import { useFetch, useEntityModal, useDelete } from "@app/shared/hooks";
import { ApplicationDependenciesFormContainer } from "@app/shared/containers";
import { Paths } from "@app/Paths";
import { Application } from "@app/api/models";
import { deleteApplication, getApplications } from "@app/api/rest";
import { getAxiosErrorMessage } from "@app/utils/utils";
import { ApplicationForm } from "../components/application-form";
import { ApplicationBusinessService } from "../components/application-business-service";
import { ImportApplicationsForm } from "../components/import-applications-form";
import { ApplicationListExpandedAreaAnalysis } from "../components/application-list-expanded-area/application-list-expanded-area-analysis";
import { ApplicationAnalysisStatus } from "../components/application-analysis-status";
import { usePaginationState } from "@app/shared/hooks/usePaginationState";
import {
  FilterCategory,
  FilterToolbar,
  FilterType,
} from "@app/shared/components/FilterToolbar";
import { useFilterState } from "@app/shared/hooks/useFilterState";
import { useSortState } from "@app/shared/hooks/useSortState";
import { AnalysisWizard } from "../analysis-wizard/analysis-wizard";
import { ApplicationIdentityForm } from "../components/application-identity-form/application-identity-form";

const ENTITY_FIELD = "entity";

const getRow = (rowData: IRowData): Application => {
  return rowData[ENTITY_FIELD];
};

export const ApplicationsTableAnalyze: React.FC = () => {
  // i18
  const { t } = useTranslation();

  // Redux
  const dispatch = useDispatch();

  const unknownTagIds = useSelector((state: RootState) =>
    unknownTagsSelectors.unknownTagIds(state)
  );

  const isWatchingBulkCopy = useSelector((state: RootState) =>
    bulkCopySelectors.isWatching(state)
  );

  // Router
  const history = useHistory();

  const fetchApplications = useCallback(() => {
    return getApplications();
  }, []);

  const {
    data: page,
    isFetching,
    fetchError,
    requestFetch: refreshTable,
  } = useFetch<Array<Application>>({
    defaultIsFetching: true,
    onFetch: fetchApplications,
  });

  const applications = useMemo(() => {
    return page ? page : undefined;
  }, [page]);

  useEffect(() => {
    refreshTable();
  }, [isWatchingBulkCopy, refreshTable]);

  const filterCategories: FilterCategory<Application>[] = [
    {
      key: "name",
      title: "Name",
      type: FilterType.search,
      placeholderText: "Filter by name...",
      getItemValue: (item) => {
        return item?.name || "";
      },
    },
    {
      key: "description",
      title: "Description",
      type: FilterType.search,
      placeholderText: "Filter by description...",
      getItemValue: (item) => {
        return item.description || "";
      },
    },
    {
      key: "businessService",
      title: "Business service",
      type: FilterType.search,
      placeholderText: "Filter by business service...",
      getItemValue: (item) => {
        return item.businessService?.name || "";
      },
    },
  ];
  const { filterValues, setFilterValues, filteredItems } = useFilterState(
    applications || [],
    filterCategories
  );
  const handleOnClearAllFilters = () => {
    setFilterValues({});
  };

  const getSortValues = (item: Application) => [
    item?.name || "",
    item?.description || "",
    item.businessService?.name || "",
    // item?.analysis || "",
    item.tags?.length || "",
    "", // Action column
  ];

  const { sortBy, onSort, sortedItems } = useSortState(
    filteredItems,
    getSortValues
  );

  const { currentPageItems, setPageNumber, paginationProps } =
    usePaginationState(sortedItems, 10);

  // Create and update modal
  const {
    isOpen: isApplicationModalOpen,
    data: applicationToUpdate,
    create: openCreateApplicationModal,
    update: openUpdateApplicationModal,
    close: closeApplicationModal,
  } = useEntityModal<Application>();

  const onApplicationModalSaved = (response: AxiosResponse<Application>) => {
    if (!applicationToUpdate) {
      dispatch(
        alertActions.addSuccess(
          t("toastr.success.added", {
            what: response.data.name,
            type: t("terms.application").toLowerCase(),
          })
        )
      );
    }

    closeApplicationModal();
    refreshTable();
  };

  // Delete
  const { requestDelete: requestDeleteApplication } = useDelete<Application>({
    onDelete: (t: Application) => deleteApplication(t.id!),
  });

  // Analyze modal
  const [isAnalyzeModalOpen, setAnalyzeModalOpen] = React.useState(false);

  // Dependencies modal
  const {
    isOpen: isDependenciesModalOpen,
    data: applicationToManageDependencies,
    update: openDependenciesModal,
    close: closeDependenciesModal,
  } = useEntityModal<Application>();

  // Credentials modal
  const {
    isOpen: isCredentialsModalOpen,
    data: applicationToManageCredentials,
    update: openCredentialsModal,
    close: closeCredentialsModal,
  } = useEntityModal<Application[]>();

  // Application import modal
  const [isApplicationImportModalOpen, setIsApplicationImportModalOpen] =
    useState(false);

  // Expand, select rows
  const {
    isItemSelected: isRowExpanded,
    toggleItemSelected: toggleRowExpanded,
  } = useSelectionState<Application>({
    items: applications || [],
    isEqual: (a, b) => a.id === b.id,
  });

  const {
    isItemSelected: isRowSelected,
    toggleItemSelected: toggleRowSelected,
    selectedItems: selectedRows,
  } = useSelectionState<Application>({
    items: applications || [],
    isEqual: (a, b) => a.id === b.id,
  });

  // Table
  const columns: ICell[] = [
    {
      title: t("terms.name"),
      transforms: [sortable, cellWidth(20)],
      cellFormatters: [expandable],
    },
    { title: t("terms.description"), transforms: [cellWidth(25)] },
    { title: t("terms.businessService"), transforms: [cellWidth(20)] },
    { title: t("terms.analysis"), transforms: [sortable, cellWidth(10)] },
    { title: t("terms.tagCount"), transforms: [sortable, cellWidth(10)] },
    {
      title: "",
      props: {
        className: "pf-c-table__inline-edit-action",
      },
    },
  ];

  const rows: IRow[] = [];
  currentPageItems?.forEach((item) => {
    const isExpanded = isRowExpanded(item);
    const isSelected = isRowSelected(item);

    rows.push({
      [ENTITY_FIELD]: item,
      isOpen: isExpanded,
      selected: isSelected,
      cells: [
        {
          title: <TableText wrapModifier="truncate">{item.name}</TableText>,
        },
        {
          title: (
            <TableText wrapModifier="truncate">{item.description}</TableText>
          ),
        },
        {
          title: (
            <TableText wrapModifier="truncate">
              {item.businessService && (
                <ApplicationBusinessService id={item.businessService.id} />
              )}
            </TableText>
          ),
        },
        {
          title: <>{item.id && <ApplicationAnalysisStatus id={item.id} />}</>,
        },
        {
          title: (
            <>
              <TagIcon />{" "}
              {item.tags
                ? item.tags.filter((e) => !unknownTagIds.has(Number(e))).length
                : 0}
            </>
          ),
        },
        {
          title: (
            <div className="pf-c-inline-edit__action pf-m-enable-editable">
              <Button
                type="button"
                variant="plain"
                onClick={() => openUpdateApplicationModal(item)}
              >
                <PencilAltIcon />
              </Button>
            </div>
          ),
        },
      ],
    });

    rows.push({
      parent: rows.length - 1,
      fullWidth: false,
      cells: [
        <div className="pf-c-table__expandable-row-content">
          <ApplicationListExpandedAreaAnalysis application={item} />
        </div>,
      ],
    });
  });

  const actionResolver = (rowData: IRowData): (IAction | ISeparator)[] => {
    const row: Application = getRow(rowData);
    if (!row) {
      return [];
    }

    const actions: (IAction | ISeparator)[] = [];

    actions.push(
      {
        title: t("actions.manageDependencies"),
        onClick: (
          event: React.MouseEvent,
          rowIndex: number,
          rowData: IRowData
        ) => {
          const row: Application = getRow(rowData);
          openDependenciesModal(row);
        },
      },
      {
        title: "Manage credentials",
        onClick: (
          event: React.MouseEvent,
          rowIndex: number,
          rowData: IRowData
        ) => {
          debugger;
          const row: Application = getRow(rowData);
          const applicationsList = [];
          applicationsList.push(row);
          openCredentialsModal(applicationsList);
        },
      },
      {
        title: t("actions.delete"),
        onClick: (
          event: React.MouseEvent,
          rowIndex: number,
          rowData: IRowData
        ) => {
          const row: Application = getRow(rowData);
          deleteRow(row);
        },
      }
    );

    return actions;
  };

  // Row actions
  const collapseRow = (
    event: React.MouseEvent,
    rowIndex: number,
    isOpen: boolean,
    rowData: IRowData,
    extraData: IExtraData
  ) => {
    const row = getRow(rowData);
    toggleRowExpanded(row);
  };

  const selectRow = (
    event: React.FormEvent<HTMLInputElement>,
    isSelected: boolean,
    rowIndex: number,
    rowData: IRowData,
    extraData: IExtraData
  ) => {
    const row = getRow(rowData);
    toggleRowSelected(row);
  };

  const deleteRow = (row: Application) => {
    dispatch(
      confirmDialogActions.openDialog({
        title: t("dialog.title.delete", {
          what: t("terms.application").toLowerCase(),
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
              refreshTable();
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

  const handleOnApplicationIdentityUpdated = (
    response: AxiosResponse<Application>
  ) => {
    closeCredentialsModal();
    refreshTable();
  };

  // Toolbar actions

  return (
    <>
      <ConditionalRender
        when={isFetching && !(applications || fetchError)}
        then={<AppPlaceholder />}
      >
        <AppTableWithControls
          count={applications ? applications.length : 0}
          paginationProps={paginationProps}
          sortBy={sortBy}
          onSort={onSort}
          onCollapse={collapseRow}
          onSelect={selectRow}
          canSelectAll={false}
          cells={columns}
          rows={rows}
          actionResolver={actionResolver}
          isLoading={isFetching}
          loadingVariant="skeleton"
          fetchError={fetchError}
          toolbarToggle={
            <FilterToolbar<Application>
              filterCategories={filterCategories}
              filterValues={filterValues}
              setFilterValues={setFilterValues}
            />
          }
          toolbarClearAllFilters={handleOnClearAllFilters}
          toolbarActions={
            <>
              <ToolbarGroup variant="button-group">
                <ToolbarItem>
                  <Button
                    type="button"
                    aria-label="create-application"
                    variant={ButtonVariant.primary}
                    onClick={openCreateApplicationModal}
                  >
                    {t("actions.createNew")}
                  </Button>
                </ToolbarItem>
                <ToolbarItem>
                  <Button
                    type="button"
                    aria-label="analyze-application"
                    variant={ButtonVariant.primary}
                    onClick={() => setAnalyzeModalOpen(true)}
                    isDisabled={selectedRows.length < 1}
                  >
                    {t("actions.analyze")}
                  </Button>
                </ToolbarItem>
                <ToolbarItem>
                  <KebabDropdown
                    dropdownItems={[
                      <DropdownItem
                        key="import-applications"
                        component="button"
                        onClick={() => setIsApplicationImportModalOpen(true)}
                      >
                        {t("actions.import")}
                      </DropdownItem>,
                      <DropdownItem
                        key="manage-application-imports"
                        onClick={() => {
                          history.push(Paths.applicationsImports);
                        }}
                      >
                        {t("actions.manageImports")}
                      </DropdownItem>,
                      <DropdownItem
                        key="manage-application-credentials"
                        isDisabled={selectedRows.length < 1}
                        onClick={() => openCredentialsModal(selectedRows)}
                      >
                        {t("actions.manageCredentials")}
                      </DropdownItem>,
                    ]}
                  />
                </ToolbarItem>
              </ToolbarGroup>
            </>
          }
          noDataState={
            <NoDataEmptyState
              // t('terms.applications')
              title={t("composed.noDataStateTitle", {
                what: t("terms.applications").toLowerCase(),
              })}
              // t('terms.application')
              description={
                t("composed.noDataStateBody", {
                  what: t("terms.application").toLowerCase(),
                }) + "."
              }
            />
          }
        />
      </ConditionalRender>

      <Modal
        title={applicationToUpdate ? "Update application" : "New application"}
        variant="medium"
        isOpen={isApplicationModalOpen}
        onClose={closeApplicationModal}
      >
        <ApplicationForm
          application={applicationToUpdate}
          onSaved={onApplicationModalSaved}
          onCancel={closeApplicationModal}
        />
      </Modal>

      {isAnalyzeModalOpen && (
        <AnalysisWizard
          applications={selectedRows}
          onClose={() => setAnalyzeModalOpen(false)}
        />
      )}

      <Modal
        isOpen={isDependenciesModalOpen}
        variant="medium"
        title={t("composed.manageDependenciesFor", {
          what: applicationToManageDependencies?.name,
        })}
        onClose={closeDependenciesModal}
      >
        {applicationToManageDependencies && (
          <ApplicationDependenciesFormContainer
            application={applicationToManageDependencies}
            onCancel={closeDependenciesModal}
          />
        )}
      </Modal>

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

      <Modal
        isOpen={isCredentialsModalOpen}
        variant="medium"
        title="Manage credentials"
        onClose={closeCredentialsModal}
      >
        {applicationToManageCredentials && (
          <ApplicationIdentityForm
            applications={applicationToManageCredentials}
            onSaved={handleOnApplicationIdentityUpdated}
            onCancel={closeCredentialsModal}
          />
        )}
      </Modal>
    </>
  );
};
