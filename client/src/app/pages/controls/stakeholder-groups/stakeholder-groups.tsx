import React, { useState } from "react";
import { AxiosError, AxiosResponse } from "axios";
import { useTranslation } from "react-i18next";
import { useSelectionState } from "@migtools/lib-ui";

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

import {
  AppPlaceholder,
  AppTableActionButtons,
  AppTableWithControls,
  ConditionalRender,
  ConfirmDialog,
  NoDataEmptyState,
} from "@app/shared/components";

import { getAxiosErrorMessage, numStr } from "@app/utils/utils";
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
import { controlsWriteScopes, RBAC, RBAC_TYPE } from "@app/rbac";
import {
  useDeleteStakeholderGroupMutation,
  useFetchStakeholderGroups,
} from "@app/queries/stakeholdergoups";
import { NotificationsContext } from "@app/shared/notifications-context";

const ENTITY_FIELD = "entity";

const getRow = (rowData: IRowData): StakeholderGroup => {
  return rowData[ENTITY_FIELD];
};

export const StakeholderGroups: React.FC = () => {
  const { t } = useTranslation();

  const [isConfirmDialogOpen, setIsConfirmDialogOpen] =
    React.useState<Boolean>(false);

  const [stakeholderGroupIdToDelete, setStakeholderGroupIdToDelete] =
    React.useState<number>();

  const { pushNotification } = React.useContext(NotificationsContext);

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [rowToUpdate, setRowToUpdate] = useState<StakeholderGroup>();

  const onDeleteStakeholderGroupSuccess = (response: any) => {
    pushNotification({
      title: t("terms.stakeholderGroupDeleted"),
      variant: "success",
    });
  };

  const onDeleteStakeholderGroupError = (error: AxiosError) => {
    pushNotification({
      title: getAxiosErrorMessage(error),
      variant: "danger",
    });
  };

  const { mutate: deleteStakeholderGroup } = useDeleteStakeholderGroupMutation(
    onDeleteStakeholderGroupSuccess,
    onDeleteStakeholderGroupError
  );

  const { stakeholderGroups, isFetching, fetchError, refetch } =
    useFetchStakeholderGroups();

  const {
    isItemSelected: isItemExpanded,
    toggleItemSelected: toggleItemExpanded,
  } = useSelectionState<StakeholderGroup>({
    items: stakeholderGroups || [],
    isEqual: (a, b) => a.id === b.id,
  });

  const columns: ICell[] = [
    {
      title: t("terms.name"),
      transforms: [sortable, cellWidth(30)],
      cellFormatters: [expandable],
    },
    { title: t("terms.description"), transforms: [sortable, cellWidth(35)] },
    {
      title: t("terms.memberCount"),
      transforms: [sortable],
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
      title: t("terms.name"),
      type: FilterType.search,
      placeholderText:
        t("actions.filterBy", {
          what: t("terms.name").toLowerCase(),
        }) + "...",
      getItemValue: (item) => {
        return item?.name || "";
      },
    },
    {
      key: "description",
      title: t("terms.description"),
      type: FilterType.search,
      placeholderText:
        t("actions.filterBy", {
          what: t("terms.description").toLowerCase(),
        }) + "...",
      getItemValue: (item) => {
        return item?.description || "";
      },
    },
    {
      key: "stakeholders",
      title: t("terms.stakeholders"),
      type: FilterType.search,
      placeholderText:
        t("actions.filterBy", {
          what: t("terms.stakeholders").toLowerCase(),
        }) + "...",
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
    "",
    item?.name || "",
    item?.description || "",
    numStr(item?.stakeholders?.length),
    "", // Action column
  ];

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
    setStakeholderGroupIdToDelete(row.id);
    setIsConfirmDialogOpen(true);
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
    refetch();
    pushNotification({
      title: t("toastr.success.added", {
        what: response.data.name,
        type: "stakeholder group",
      }),
      variant: "success",
    });
  };

  const handleOnCreateNewCancel = () => {
    setIsNewModalOpen(false);
  };

  // Update Modal

  const handleOnUpdated = () => {
    setRowToUpdate(undefined);
    refetch();
  };

  const handleOnUpdatedCancel = () => {
    setRowToUpdate(undefined);
  };

  // t("terms.stakeholderGroup")
  return (
    <>
      <ConditionalRender
        when={isFetching && !(stakeholderGroups || fetchError)}
        then={<AppPlaceholder />}
      >
        <AppTableWithControls
          count={stakeholderGroups ? stakeholderGroups.length : 0}
          paginationProps={paginationProps}
          paginationIdPrefix="stakeholder-groups"
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
                <RBAC
                  allowedPermissions={controlsWriteScopes}
                  rbacType={RBAC_TYPE.Scope}
                >
                  <Button
                    type="button"
                    id="create-stakeholder-group"
                    aria-label="Create stakeholder group"
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
      {isConfirmDialogOpen && (
        <ConfirmDialog
          title={t("dialog.title.delete", {
            what: t("terms.stakeholderGroup").toLowerCase(),
          })}
          isOpen={true}
          titleIconVariant={"warning"}
          message={t("dialog.message.delete")}
          confirmBtnVariant={ButtonVariant.danger}
          confirmBtnLabel={t("actions.delete")}
          cancelBtnLabel={t("actions.cancel")}
          onCancel={() => setIsConfirmDialogOpen(false)}
          onClose={() => setIsConfirmDialogOpen(false)}
          onConfirm={() => {
            if (stakeholderGroupIdToDelete) {
              deleteStakeholderGroup(stakeholderGroupIdToDelete);
              setStakeholderGroupIdToDelete(undefined);
            }
            setIsConfirmDialogOpen(false);
          }}
        />
      )}
    </>
  );
};
