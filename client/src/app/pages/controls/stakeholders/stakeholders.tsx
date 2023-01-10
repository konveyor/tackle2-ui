import * as React from "react";
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
import { getAxiosErrorMessage } from "@app/utils/utils";
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
import {
  useDeleteStakeholderMutation,
  useFetchStakeholders,
} from "@app/queries/stakeholders";
import { NotificationsContext } from "@app/shared/notifications-context";

const ENTITY_FIELD = "entity";

const getRow = (rowData: IRowData): Stakeholder => {
  return rowData[ENTITY_FIELD];
};

export const Stakeholders: React.FC = () => {
  const { t } = useTranslation();

  const [isConfirmDialogOpen, setIsConfirmDialogOpen] =
    React.useState<Boolean>(false);

  const [stakeholderIdToDelete, setStakeholderIdToDelete] =
    React.useState<number>();

  const [isNewModalOpen, setIsNewModalOpen] = React.useState(false);
  const [rowToUpdate, setRowToUpdate] = React.useState<Stakeholder>();
  const { pushNotification } = React.useContext(NotificationsContext);

  const onDeleteStakeholderSuccess = (response: any) => {
    pushNotification({
      title: t("terms.stakeholderDeleted"),
      variant: "success",
    });
  };

  const onDeleteStakeholderError = (error: AxiosError) => {
    pushNotification({
      title: getAxiosErrorMessage(error),
      variant: "danger",
    });
  };

  const { mutate: deleteStakeholder } = useDeleteStakeholderMutation(
    onDeleteStakeholderSuccess,
    onDeleteStakeholderError
  );

  const { stakeholders, isFetching, fetchError, refetch } =
    useFetchStakeholders();

  const {
    isItemSelected: isItemExpanded,
    toggleItemSelected: toggleItemExpanded,
  } = useSelectionState<Stakeholder>({
    items: stakeholders || [],
    isEqual: (a, b) => a.id === b.id,
  });

  const filterCategories: FilterCategory<Stakeholder>[] = [
    {
      key: "email",
      title: t("terms.email"),
      type: FilterType.search,
      placeholderText:
        t("actions.filterBy", {
          what: t("terms.email").toLowerCase(),
        }) + "...",
      getItemValue: (item) => {
        return item?.email || "";
      },
    },
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
      key: "jobFunction",
      title: t("terms.jobFunction"),
      type: FilterType.search,
      placeholderText:
        t("actions.filterBy", {
          what: t("terms.jobFunction").toLowerCase(),
        }) + "...",
      getItemValue: (item) => {
        return item.jobFunction?.name || "";
      },
    },
    {
      key: "stakeholderGroups",
      title: t("terms.stakeholderGroups"),
      type: FilterType.search,
      placeholderText:
        t("actions.filterBy", {
          what: t("terms.stakeholderGroups").toLowerCase(),
        }) + "...",
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
    setStakeholderIdToDelete(row.id);
    setIsConfirmDialogOpen(true);
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
    refetch();

    pushNotification({
      title: t("toastr.success.added", {
        what: response.data.name,
        type: "stakeholder",
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
                    id="create-stakeholder"
                    aria-label="Create stakeholder"
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
      {isConfirmDialogOpen && (
        <ConfirmDialog
          title={t("dialog.title.delete", {
            what: t("terms.stakeholder").toLowerCase(),
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
            if (stakeholderIdToDelete) {
              deleteStakeholder(stakeholderIdToDelete);
              setStakeholderIdToDelete(undefined);
            }
            setIsConfirmDialogOpen(false);
          }}
        />
      )}
    </>
  );
};
