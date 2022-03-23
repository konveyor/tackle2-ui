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
  ToolbarChip,
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
  SearchFilter,
  AppTableToolbarToggleGroup,
  NoDataEmptyState,
} from "@app/shared/components";
import {
  useTableControls,
  useFetchStakeholderGroups,
  useDelete,
} from "@app/shared/hooks";

import { getAxiosErrorMessage } from "@app/utils/utils";
import { deleteStakeholderGroup } from "@app/api/rest";
import { StakeholderGroup } from "@app/api/models";

import { NewStakeholderGroupModal } from "./components/new-stakeholder-group-modal";
import { UpdateStakeholderGroupModal } from "./components/update-stakeholder-group-modal";
import { usePaginationState } from "@app/shared/hooks/usePaginationState";
import {
  FilterCategory,
  FilterToolbar,
  FilterType,
} from "@app/shared/components/FilterToolbar";
import { useFilterState } from "@app/shared/hooks/useFilterState";
import { useSortState } from "@app/shared/hooks/useSortState";
import { RBAC } from "@app/rbac";
import * as roles from "@app/roles";

const ENTITY_FIELD = "entity";

const getRow = (rowData: IRowData): StakeholderGroup => {
  return rowData[ENTITY_FIELD];
};

export const StakeholderGroups: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [rowToUpdate, setRowToUpdate] = useState<StakeholderGroup>();

  const { requestDelete: requestDeleteStakeholderGroup } =
    useDelete<StakeholderGroup>({
      onDelete: (t: StakeholderGroup) => deleteStakeholderGroup(t.id!),
    });

  const { stakeholderGroups, isFetching, fetchError, fetchStakeholderGroups } =
    useFetchStakeholderGroups(true);

  const {
    isItemSelected: isItemExpanded,
    toggleItemSelected: toggleItemExpanded,
  } = useSelectionState<StakeholderGroup>({
    items: stakeholderGroups || [],
    isEqual: (a, b) => a.id === b.id,
  });

  useEffect(() => {
    fetchStakeholderGroups();
  }, [fetchStakeholderGroups]);

  const columns: ICell[] = [
    {
      title: t("terms.name"),
      transforms: [sortable, cellWidth(30)],
      cellFormatters: [expandable],
    },
    { title: t("terms.description"), transforms: [cellWidth(35)] },
    {
      title: t("terms.memberCount"),
      // transforms: [sortable],
    },
    {
      title: "",
      props: {
        className: "pf-u-text-align-right",
      },
    },
  ];

  const filterCategories: FilterCategory<StakeholderGroup>[] = [
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
        return item?.description || "";
      },
    },
    {
      key: "stakeholders",
      title: "Stakeholders",
      type: FilterType.search,
      placeholderText: "Filter by stakeholders...",
      getItemValue: (stakeholderGroup) => {
        const stakeholders = stakeholderGroup.stakeholders?.map(
          (stakeholder) => stakeholder.name
        );
        return stakeholders?.join(" ; ") || "";
      },
    },
  ];
  const { filterValues, setFilterValues, filteredItems } = useFilterState(
    stakeholderGroups || [],
    filterCategories
  );
  const getSortValues = (item: StakeholderGroup) => [
    item?.name || "",
    item.description || "",
    getStakeholderNameList(item) || "",
    "", // Action column
  ];

  const getStakeholderNameList = (stakeholderGroup: StakeholderGroup) => {
    const stakeholders = stakeholderGroup.stakeholders?.map(
      (stakeholder) => stakeholder.name
    );
    return stakeholders?.join(" ; ") || "";
  };

  const { sortBy, onSort, sortedItems } = useSortState(
    filteredItems,
    getSortValues
  );
  const { currentPageItems, setPageNumber, paginationProps } =
    usePaginationState(sortedItems, 10);

  const rows: IRow[] = [];
  currentPageItems?.forEach((item) => {
    const isExpanded = isItemExpanded(item);
    rows.push({
      [ENTITY_FIELD]: item,
      isOpen: isExpanded,
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
          title: item.stakeholders ? item.stakeholders.length : 0,
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
                <DescriptionListTerm>
                  {t("terms.member(s)")}
                </DescriptionListTerm>
                <DescriptionListDescription>
                  {item.stakeholders?.map((f) => f.name).join(", ")}
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

  const editRow = (row: StakeholderGroup) => {
    setRowToUpdate(row);
  };

  const deleteRow = (row: StakeholderGroup) => {
    dispatch(
      confirmDialogActions.openDialog({
        // t("terms.stakeholderGroup")
        title: t("dialog.title.delete", {
          what: t("terms.stakeholderGroup").toLowerCase(),
        }),
        titleIconVariant: "warning",
        message: t("dialog.message.delete"),
        confirmBtnVariant: ButtonVariant.danger,
        confirmBtnLabel: t("actions.delete"),
        cancelBtnLabel: t("actions.cancel"),
        onConfirm: () => {
          dispatch(confirmDialogActions.processing());
          requestDeleteStakeholderGroup(
            row,
            () => {
              dispatch(confirmDialogActions.closeDialog());
              fetchStakeholderGroups();
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

  // Create Modal

  const handleOnOpenCreateNewModal = () => {
    setIsNewModalOpen(true);
  };

  const handleOnCreatedNew = (response: AxiosResponse<StakeholderGroup>) => {
    setIsNewModalOpen(false);
    fetchStakeholderGroups();

    dispatch(
      alertActions.addSuccess(
        t("toastr.success.added", {
          what: response.data.name,
          type: "stakeholder group",
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
    fetchStakeholderGroups();
  };

  const handleOnUpdatedCancel = () => {
    setRowToUpdate(undefined);
  };

  return (
    <>
      <ConditionalRender
        when={isFetching && !(stakeholderGroups || fetchError)}
        then={<AppPlaceholder />}
      >
        <AppTableWithControls
          count={stakeholderGroups ? stakeholderGroups.length : 0}
          paginationProps={paginationProps}
          sortBy={sortBy}
          onSort={onSort}
          onCollapse={collapseRow}
          cells={columns}
          rows={rows}
          isLoading={isFetching}
          loadingVariant="skeleton"
          fetchError={fetchError}
          toolbarClearAllFilters={handleOnClearAllFilters}
          toolbarToggle={
            <FilterToolbar<StakeholderGroup>
              filterCategories={filterCategories}
              filterValues={filterValues}
              setFilterValues={setFilterValues}
            />
          }
          toolbarActions={
            <ToolbarGroup variant="button-group">
              <ToolbarItem>
                <RBAC allowedRoles={roles.writeScopes}>
                  <Button
                    type="button"
                    aria-label="create-stakeholder-group"
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
              // t('terms.stakeholderGroups')
              title={t("composed.noDataStateTitle", {
                what: t("terms.stakeholderGroups").toLowerCase(),
              })}
              // t('terms.stakeholderGroup')
              description={
                t("composed.noDataStateBody", {
                  what: t("terms.stakeholderGroup").toLowerCase(),
                }) + "."
              }
            />
          }
        />
      </ConditionalRender>

      <NewStakeholderGroupModal
        isOpen={isNewModalOpen}
        onSaved={handleOnCreatedNew}
        onCancel={handleOnCreateNewCancel}
      />
      <UpdateStakeholderGroupModal
        stakeholderGroup={rowToUpdate}
        onSaved={handleOnUpdated}
        onCancel={handleOnUpdatedCancel}
      />
    </>
  );
};
