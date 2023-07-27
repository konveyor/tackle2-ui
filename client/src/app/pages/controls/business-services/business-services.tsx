import React from "react";
import { AxiosError } from "axios";
import { useTranslation } from "react-i18next";
import {
  Button,
  ButtonVariant,
  Modal,
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
import { BusinessServiceForm } from "./components/business-service-form";
import { useLegacyPaginationState } from "@app/shared/hooks/useLegacyPaginationState";
import {
  FilterCategory,
  FilterToolbar,
  FilterType,
} from "@app/shared/components/FilterToolbar";
import { useLegacyFilterState } from "@app/shared/hooks/useLegacyFilterState";
import { useLegacySortState } from "@app/shared/hooks/useLegacySortState";
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
  const { pushNotification } = React.useContext(NotificationsContext);

  const [isConfirmDialogOpen, setIsConfirmDialogOpen] =
    React.useState<Boolean>(false);

  const [businessServiceIdToDelete, setBusinessServiceIdToDelete] =
    React.useState<number>();

  const [createUpdateModalState, setCreateUpdateModalState] = React.useState<
    "create" | BusinessService | null
  >(null);
  const isCreateUpdateModalOpen = createUpdateModalState !== null;
  const businessServiceToUpdate =
    createUpdateModalState !== "create" ? createUpdateModalState : null;

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

  const { data: applications } = useFetchApplications();

  const filterCategories: FilterCategory<
    BusinessService,
    "name" | "description" | "owner"
  >[] = [
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

  const { filterValues, setFilterValues, filteredItems } = useLegacyFilterState(
    businessServices || [],
    filterCategories
  );
  const getSortValues = (businessService: BusinessService) => [
    businessService?.name || "",
    businessService?.description || "",
    businessService.owner?.name || "",
    "", // Action column
  ];

  const { sortBy, onSort, sortedItems } = useLegacySortState(
    filteredItems,
    getSortValues
  );

  const { currentPageItems, setPageNumber, paginationProps } =
    useLegacyPaginationState(sortedItems, 10);

  const columns: ICell[] = [
    { title: t("terms.name"), transforms: [sortable, cellWidth(25)] },
    { title: t("terms.description"), transforms: [cellWidth(40)] },
    { title: t("terms.owner"), transforms: [sortable] },
    {
      title: "",
      props: {
        className: "pf-v5-u-text-align-right",
      },
    },
  ];

  const rows: IRow[] = [];
  currentPageItems?.forEach((item) => {
    const isAssignedToApplication = applications?.some(
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
              onEdit={() => setCreateUpdateModalState(item)}
              onDelete={() => deleteRow(item)}
            />
          ),
        },
      ],
    });
  });

  const deleteRow = (row: BusinessService) => {
    setBusinessServiceIdToDelete(row.id);
    setIsConfirmDialogOpen(true);
  };

  // Advanced filters

  const handleOnClearAllFilters = () => {
    setFilterValues({});
  };

  // Update Modal

  const closeCreateUpdateModal = () => {
    setCreateUpdateModalState(null);
    refetch;
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
            <FilterToolbar
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
                    id="create-business-service"
                    aria-label="Create business service"
                    variant={ButtonVariant.primary}
                    onClick={() => setCreateUpdateModalState("create")}
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
              description={t("composed.noDataStateBody", {
                what: t("terms.businessService").toLowerCase(),
              })}
            />
          }
        />
      </ConditionalRender>

      <Modal
        id="create-edit-stakeholder-modal"
        title={t(
          businessServiceToUpdate ? "dialog.title.update" : "dialog.title.new",
          {
            what: t("terms.businessService").toLowerCase(),
          }
        )}
        variant="medium"
        isOpen={isCreateUpdateModalOpen}
        onClose={closeCreateUpdateModal}
      >
        <BusinessServiceForm
          businessService={businessServiceToUpdate}
          onClose={closeCreateUpdateModal}
        />
      </Modal>
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
