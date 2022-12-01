import React, { useState } from "react";
import { AxiosError, AxiosResponse } from "axios";
import { useTranslation } from "react-i18next";

import {
  Button,
  ButtonVariant,
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

import {
  AppPlaceholder,
  ConditionalRender,
  AppTableWithControls,
  AppTableActionButtons,
  NoDataEmptyState,
  ConfirmDialog,
} from "@app/shared/components";

import { BusinessService } from "@app/api/models";
import { getAxiosErrorMessage } from "@app/utils/utils";

import { NewBusinessServiceModal } from "./components/new-business-service-modal";
import { UpdateBusinessServiceModal } from "./components/update-business-service-modal";
import { usePaginationState } from "@app/shared/hooks/usePaginationState";
import {
  FilterCategory,
  FilterToolbar,
  FilterType,
} from "@app/shared/components/FilterToolbar";
import { useFilterState } from "@app/shared/hooks/useFilterState";
import { useSortState } from "@app/shared/hooks/useSortState";
import { controlsWriteScopes, RBAC, RBAC_TYPE } from "@app/rbac";
import { useFetchApplications } from "@app/queries/applications";
import {
  useDeleteBusinessServiceMutation,
  useFetchBusinessServices,
} from "@app/queries/businessservices";
import { NotificationsContext } from "@app/shared/notifications-context";

const ENTITY_FIELD = "entity";

export const BusinessServices: React.FC = () => {
  const { t } = useTranslation();

  const [isConfirmDialogOpen, setIsConfirmDialogOpen] =
    React.useState<Boolean>(false);

  const [businessServiceIdToDelete, setBusinessServiceIdToDelete] =
    React.useState<number>();

  const { pushNotification } = React.useContext(NotificationsContext);

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [rowToUpdate, setRowToUpdate] = useState<BusinessService>();

  const onDeleteBusinessServiceSuccess = (response: any) => {
    pushNotification({
      title: t("terms.businessServiceDeleted"),
      variant: "success",
    });
  };

  const onDeleteBusinessServiceError = (error: AxiosError) => {
    pushNotification({
      title: getAxiosErrorMessage(error),
      variant: "danger",
    });
  };

  const { mutate: deleteBusinessService } = useDeleteBusinessServiceMutation(
    onDeleteBusinessServiceSuccess,
    onDeleteBusinessServiceError
  );

  const { businessServices, isFetching, fetchError, refetch } =
    useFetchBusinessServices();

  const { applications } = useFetchApplications();

  const filterCategories: FilterCategory<BusinessService>[] = [
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
        return item.description || "";
      },
    },
    {
      key: "owner",
      title: t("terms.createdBy"),
      type: FilterType.search,
      placeholderText:
        t("actions.filterBy", {
          what: t("terms.owner").toLowerCase(),
        }) + "...",
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
    const isAssignedToApplication = applications.some(
      (app) => app.businessService?.id === item.id
    );
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
              isDeleteEnabled={isAssignedToApplication}
              tooltipMessage="Cannot remove a business service associated with application(s)"
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
    setBusinessServiceIdToDelete(row.id);
    setIsConfirmDialogOpen(true);
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
    refetch();
    pushNotification({
      title: t("toastr.success.added", {
        what: response.data.name,
        type: "business service",
      }),
      variant: "success",
    });
  };

  const handleOnCancelCreateBusinessService = () => {
    setIsNewModalOpen(false);
  };

  // Update Modal

  const handleOnBusinessServiceUpdated = () => {
    setRowToUpdate(undefined);
    refetch();
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
          paginationIdPrefix="business-services"
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
                <RBAC
                  allowedPermissions={controlsWriteScopes}
                  rbacType={RBAC_TYPE.Scope}
                >
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
      {isConfirmDialogOpen && (
        <ConfirmDialog
          title={t("dialog.title.delete", {
            what: t("terms.businessService").toLowerCase(),
          })}
          titleIconVariant={"warning"}
          message={t("dialog.message.delete")}
          isOpen={true}
          confirmBtnVariant={ButtonVariant.danger}
          confirmBtnLabel={t("actions.delete")}
          cancelBtnLabel={t("actions.cancel")}
          onCancel={() => setIsConfirmDialogOpen(false)}
          onClose={() => setIsConfirmDialogOpen(false)}
          onConfirm={() => {
            if (businessServiceIdToDelete) {
              deleteBusinessService(businessServiceIdToDelete);
              setBusinessServiceIdToDelete(undefined);
            }
            setIsConfirmDialogOpen(false);
          }}
        />
      )}
    </>
  );
};
