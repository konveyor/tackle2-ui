import React, { useCallback, useEffect, useState } from "react";
import { AxiosResponse } from "axios";
import { useTranslation } from "react-i18next";

import {
  Button,
  ButtonVariant,
  ToolbarChip,
  ToolbarGroup,
  ToolbarItem,
} from "@patternfly/react-core";
import {
  cellWidth,
  ICell,
  IRow,
  sortable,
  TableText,
} from "@patternfly/react-table";

import { useDispatch } from "react-redux";
import { alertActions } from "@app/store/alert";
import { confirmDialogActions } from "@app/store/confirmDialog";

import {
  AppPlaceholder,
  ConditionalRender,
  AppTableWithControls,
  SearchFilter,
  AppTableActionButtons,
  AppTableToolbarToggleGroup,
  NoDataEmptyState,
} from "@app/shared/components";
import {
  useTableControls,
  useFetchBusinessServices,
  useDelete,
} from "@app/shared/hooks";

import { BusinessService, Identity, SortByQuery } from "@app/api/models";
import { deleteBusinessService } from "@app/api/rest";
import { getAxiosErrorMessage } from "@app/utils/utils";

import { NewBusinessServiceModal } from "./components/new-business-service-modal";
import { UpdateBusinessServiceModal } from "./components/update-business-service-modal";
import { usePaginationState } from "@app/shared/hooks/usePaginationState";
import {
  FilterCategory,
  FilterToolbar,
  FilterType,
} from "@app/shared/components/FilterToolbar";
import identities from "@app/pages/identities";
import { useFilterState } from "@app/shared/hooks/useFilterState";
import { useSortState } from "@app/shared/hooks/useSortState";
import { RBAC } from "@app/rbac";
import * as roles from "@app/roles";

const ENTITY_FIELD = "entity";

// const getRow = (rowData: IRowData): BusinessService => {
//   return rowData[ENTITY_FIELD];
// };

export const BusinessServices: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [rowToUpdate, setRowToUpdate] = useState<BusinessService>();

  const { requestDelete: requestDeleteBusinessService } =
    useDelete<BusinessService>({
      onDelete: (t: BusinessService) => deleteBusinessService(t.id!),
    });

  const { businessServices, isFetching, fetchError, fetchBusinessServices } =
    useFetchBusinessServices(true);

  const refreshTable = useCallback(() => {
    fetchBusinessServices();
  }, [fetchBusinessServices]);

  useEffect(() => {
    fetchBusinessServices();
  }, [fetchBusinessServices]);

  const filterCategories: FilterCategory<BusinessService>[] = [
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
      key: "owner",
      title: "Created By",
      type: FilterType.search,
      placeholderText: "Filter by owner...",
      getItemValue: (item) => {
        return item.owner?.name || "";
      },
    },
  ];

  const { filterValues, setFilterValues, filteredItems } = useFilterState(
    businessServices || [],
    filterCategories
  );
  const getSortValues = (businessService: BusinessService) => [
    businessService?.name || "",
    businessService?.description || "",
    businessService.owner?.name || "",
    "", // Action column
  ];

  const { sortBy, onSort, sortedItems } = useSortState(
    filteredItems,
    getSortValues
  );

  const { currentPageItems, setPageNumber, paginationProps } =
    usePaginationState(sortedItems, 10);

  const columns: ICell[] = [
    { title: t("terms.name"), transforms: [sortable, cellWidth(25)] },
    { title: t("terms.description"), transforms: [cellWidth(40)] },
    { title: t("terms.owner"), transforms: [sortable] },
    {
      title: "",
      props: {
        className: "pf-u-text-align-right",
      },
    },
  ];

  const rows: IRow[] = [];
  currentPageItems?.forEach((item) => {
    rows.push({
      [ENTITY_FIELD]: item,
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
            <TableText wrapModifier="truncate">{item.owner?.name}</TableText>
          ),
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
  });

  const editRow = (row: BusinessService) => {
    setRowToUpdate(row);
  };

  const deleteRow = (row: BusinessService) => {
    dispatch(
      confirmDialogActions.openDialog({
        // t("terms.businessService")
        title: t("dialog.title.delete", {
          what: t("terms.businessService").toLowerCase(),
        }),
        titleIconVariant: "warning",
        message: t("dialog.message.delete"),
        confirmBtnVariant: ButtonVariant.danger,
        confirmBtnLabel: t("actions.delete"),
        cancelBtnLabel: t("actions.cancel"),
        onConfirm: () => {
          dispatch(confirmDialogActions.processing());
          requestDeleteBusinessService(
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

  // Create Modal

  const handleOnOpenCreateNewBusinessServiceModal = () => {
    setIsNewModalOpen(true);
  };

  const handleOnBusinessServiceCreated = (
    response: AxiosResponse<BusinessService>
  ) => {
    setIsNewModalOpen(false);
    refreshTable();

    dispatch(
      alertActions.addSuccess(
        t("toastr.success.added", {
          what: response.data.name,
          type: "business service",
        })
      )
    );
  };

  const handleOnCancelCreateBusinessService = () => {
    setIsNewModalOpen(false);
  };

  // Update Modal

  const handleOnBusinessServiceUpdated = () => {
    setRowToUpdate(undefined);
    refreshTable();
  };

  const handleOnCancelUpdateBusinessService = () => {
    setRowToUpdate(undefined);
  };

  return (
    <>
      <ConditionalRender
        when={isFetching && !(businessServices || fetchError)}
        then={<AppPlaceholder />}
      >
        <AppTableWithControls
          count={businessServices ? businessServices.length : 0}
          paginationProps={paginationProps}
          sortBy={sortBy}
          onSort={onSort}
          cells={columns}
          rows={rows}
          isLoading={isFetching}
          loadingVariant="skeleton"
          fetchError={fetchError}
          toolbarClearAllFilters={handleOnClearAllFilters}
          toolbarToggle={
            <FilterToolbar<BusinessService>
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
                    aria-label="create-business-service"
                    variant={ButtonVariant.primary}
                    onClick={handleOnOpenCreateNewBusinessServiceModal}
                  >
                    {t("actions.createNew")}
                  </Button>
                </RBAC>
              </ToolbarItem>
            </ToolbarGroup>
          }
          noDataState={
            <NoDataEmptyState
              // t('terms.businessServices')
              title={t("composed.noDataStateTitle", {
                what: t("terms.businessServices").toLowerCase(),
              })}
              // t('terms.businessService')
              description={
                t("composed.noDataStateBody", {
                  what: t("terms.businessService").toLowerCase(),
                }) + "."
              }
            />
          }
        />
      </ConditionalRender>

      <NewBusinessServiceModal
        isOpen={isNewModalOpen}
        onSaved={handleOnBusinessServiceCreated}
        onCancel={handleOnCancelCreateBusinessService}
      />
      <UpdateBusinessServiceModal
        businessService={rowToUpdate}
        onSaved={handleOnBusinessServiceUpdated}
        onCancel={handleOnCancelUpdateBusinessService}
      />
    </>
  );
};
