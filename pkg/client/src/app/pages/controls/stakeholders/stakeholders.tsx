import React, { useCallback, useEffect, useState } from "react";
import { AxiosResponse } from "axios";
import { useTranslation } from "react-i18next";
import { useSelectionState } from "@konveyor/lib-ui";

import {
  Button,
  ButtonVariant,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  ToolbarGroup,
  ToolbarItem,
} from "@patternfly/react-core";
import {
  cellWidth,
  expandable,
  ICell,
  IExtraData,
  IRow,
  IRowData,
  sortable,
  TableText,
} from "@patternfly/react-table";

import { useDispatch } from "react-redux";
import { alertActions } from "@app/store/alert";
import { confirmDialogActions } from "@app/store/confirmDialog";

import {
  AppPlaceholder,
  AppTableActionButtons,
  AppTableWithControls,
  ConditionalRender,
  NoDataEmptyState,
} from "@app/shared/components";
import { useFetchStakeholders, useDelete } from "@app/shared/hooks";

import { getAxiosErrorMessage } from "@app/utils/utils";
import { deleteStakeholder } from "@app/api/rest";
import { Stakeholder } from "@app/api/models";

import { NewStakeholderModal } from "./components/new-stakeholder-modal";
import { UpdateStakeholderModal } from "./components/update-stakeholder-modal";
import { usePaginationState } from "@app/shared/hooks/usePaginationState";
import {
  FilterCategory,
  FilterToolbar,
  FilterType,
} from "@app/shared/components/FilterToolbar";
import { useFilterState } from "@app/shared/hooks/useFilterState";
import { useSortState } from "@app/shared/hooks/useSortState";
import { controlsWriteScopes, RBAC, RBAC_TYPE } from "@app/rbac";

const ENTITY_FIELD = "entity";

const getRow = (rowData: IRowData): Stakeholder => {
  return rowData[ENTITY_FIELD];
};

export const Stakeholders: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [rowToUpdate, setRowToUpdate] = useState<Stakeholder>();

  const { requestDelete: requestDeleteStakeholder } = useDelete<Stakeholder>({
    onDelete: (t: Stakeholder) => deleteStakeholder(t.id!),
  });

  const { stakeholders, isFetching, fetchError, fetchStakeholders } =
    useFetchStakeholders(true);

  const {
    isItemSelected: isItemExpanded,
    toggleItemSelected: toggleItemExpanded,
  } = useSelectionState<Stakeholder>({
    items: stakeholders || [],
    isEqual: (a, b) => a.id === b.id,
  });

  const refreshTable = useCallback(() => {
    fetchStakeholders();
  }, [fetchStakeholders]);

  useEffect(() => {
    fetchStakeholders();
  }, [fetchStakeholders]);

  const filterCategories: FilterCategory<Stakeholder>[] = [
    {
      key: "email",
      title: "Email",
      type: FilterType.search,
      placeholderText: "Filter by email...",
      getItemValue: (item) => {
        return item?.email || "";
      },
    },
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
      key: "jobFunction",
      title: "Job function",
      type: FilterType.search,
      placeholderText: "Filter by job function...",
      getItemValue: (item) => {
        return item.jobFunction?.name || "";
      },
    },
    {
      key: "stakeholderGroups",
      title: "Stakeholder groups",
      type: FilterType.search,
      placeholderText: "Filter by stakeholder groups...",
      getItemValue: (stakeholder) => {
        const stakeholderGroups = stakeholder.stakeholderGroups?.map(
          (stakeholderGroup) => stakeholderGroup.name
        );
        return stakeholderGroups?.join(" ; ") || "";
      },
    },
  ];
  const { filterValues, setFilterValues, filteredItems } = useFilterState(
    stakeholders || [],
    filterCategories
  );
  const getSortValues = (item: Stakeholder) => [
    "",
    item?.email || "",
    item?.name || "",
    item.jobFunction?.name || "",
    item?.stakeholderGroups?.length || 0,
    "", // Action column
  ];

  const { sortBy, onSort, sortedItems } = useSortState(
    filteredItems,
    getSortValues
  );

  const { currentPageItems, setPageNumber, paginationProps } =
    usePaginationState(sortedItems, 10);

  const columns: ICell[] = [
    {
      title: t("terms.email"),
      transforms: [sortable, cellWidth(20)],
      cellFormatters: [expandable],
    },
    { title: t("terms.displayName"), transforms: [sortable, cellWidth(25)] },
    { title: t("terms.jobFunction"), transforms: [sortable, cellWidth(20)] },
    {
      title: t("terms.groupCount"),
      transforms: [sortable],
    },
    {
      title: "",
      props: {
        className: "pf-u-text-align-right",
      },
    },
  ];

  const rows: IRow[] = [];
  currentPageItems?.forEach((item) => {
    const isExpanded = isItemExpanded(item);
    rows.push({
      [ENTITY_FIELD]: item,
      isOpen: isExpanded,
      cells: [
        {
          title: item.email,
        },
        {
          title: <TableText wrapModifier="truncate">{item.name}</TableText>,
        },
        {
          title: (
            <TableText wrapModifier="truncate">
              {item.jobFunction?.name}
            </TableText>
          ),
        },
        {
          title: item.stakeholderGroups ? item.stakeholderGroups.length : 0,
        },
        {
          title: (
            <AppTableActionButtons
              onEdit={() => editRow(item)}
              onDelete={() => deleteRow(item)}
            />
          ),
        },
      ],
    });

    if (isExpanded) {
      rows.push({
        parent: rows.length - 1,
        fullWidth: false,
        cells: [
          <div className="pf-c-table__expandable-row-content">
            <DescriptionList>
              <DescriptionListGroup>
                <DescriptionListTerm>{t("terms.group(s)")}</DescriptionListTerm>
                <DescriptionListDescription>
                  {item.stakeholderGroups?.map((f) => f.name).join(", ")}
                </DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
          </div>,
        ],
      });
    }
  });

  // Rows

  const collapseRow = (
    event: React.MouseEvent,
    rowIndex: number,
    isOpen: boolean,
    rowData: IRowData,
    extraData: IExtraData
  ) => {
    const row = getRow(rowData);
    toggleItemExpanded(row);
  };

  const editRow = (row: Stakeholder) => {
    setRowToUpdate(row);
  };

  const deleteRow = (row: Stakeholder) => {
    dispatch(
      confirmDialogActions.openDialog({
        // t("terms.stakeholder")
        title: t("dialog.title.delete", {
          what: t("terms.stakeholder").toLowerCase(),
        }),
        titleIconVariant: "warning",
        message: t("dialog.message.delete"),
        confirmBtnVariant: ButtonVariant.danger,
        confirmBtnLabel: t("actions.delete"),
        cancelBtnLabel: t("actions.cancel"),
        onConfirm: () => {
          dispatch(confirmDialogActions.processing());
          requestDeleteStakeholder(
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

  // Advanced filters

  const handleOnClearAllFilters = () => {
    setFilterValues({});
  };

  const handleOnOpenCreateNewModal = () => {
    setIsNewModalOpen(true);
  };

  const handleOnCreatedNew = (response: AxiosResponse<Stakeholder>) => {
    setIsNewModalOpen(false);
    refreshTable();

    dispatch(
      alertActions.addSuccess(
        t("toastr.success.added", {
          what: response.data.name,
          type: "stakeholder",
        })
      )
    );
  };

  const handleOnCreateNewCancel = () => {
    setIsNewModalOpen(false);
  };

  // Update Modal

  const handleOnUpdated = () => {
    setRowToUpdate(undefined);
    refreshTable();
  };

  const handleOnUpdatedCancel = () => {
    setRowToUpdate(undefined);
  };

  return (
    <>
      <ConditionalRender
        when={isFetching && !(stakeholders || fetchError)}
        then={<AppPlaceholder />}
      >
        <AppTableWithControls
          paginationProps={paginationProps}
          paginationIdPrefix="stakeholders"
          count={stakeholders ? stakeholders.length : 0}
          sortBy={sortBy}
          onSort={onSort}
          onCollapse={collapseRow}
          cells={columns}
          rows={rows}
          // actions={actions}
          isLoading={isFetching}
          loadingVariant="skeleton"
          fetchError={fetchError}
          toolbarClearAllFilters={handleOnClearAllFilters}
          toolbarToggle={
            <FilterToolbar<Stakeholder>
              filterCategories={filterCategories}
              filterValues={filterValues}
              setFilterValues={setFilterValues}
            />
          }
          toolbarActions={
            <ToolbarGroup variant="button-group">
              <ToolbarItem>
                <RBAC
                  allowedPermissions={controlsWriteScopes}
                  rbacType={RBAC_TYPE.Scope}
                >
                  <Button
                    type="button"
                    aria-label="create-stakeholder"
                    variant={ButtonVariant.primary}
                    onClick={handleOnOpenCreateNewModal}
                  >
                    {t("actions.createNew")}
                  </Button>
                </RBAC>
              </ToolbarItem>
            </ToolbarGroup>
          }
          noDataState={
            <NoDataEmptyState
              // t('terms.stakeholders')
              title={t("composed.noDataStateTitle", {
                what: t("terms.stakeholders").toLowerCase(),
              })}
              // t('terms.stakeholder')
              description={
                t("composed.noDataStateBody", {
                  what: t("terms.stakeholder").toLowerCase(),
                }) + "."
              }
            />
          }
        />
      </ConditionalRender>

      <NewStakeholderModal
        isOpen={isNewModalOpen}
        onSaved={handleOnCreatedNew}
        onCancel={handleOnCreateNewCancel}
      />
      <UpdateStakeholderModal
        stakeholder={rowToUpdate}
        onSaved={handleOnUpdated}
        onCancel={handleOnUpdatedCancel}
      />
    </>
  );
};
