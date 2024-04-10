import React from "react";
import { AxiosError } from "axios";
import { useTranslation } from "react-i18next";
import {
  Button,
  ButtonVariant,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  Modal,
  Title,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
} from "@patternfly/react-core";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";

import { BusinessService } from "@app/api/models";
import { getAxiosErrorMessage } from "@app/utils/utils";
import { BusinessServiceForm } from "./components/business-service-form";
import { FilterToolbar, FilterType } from "@app/components/FilterToolbar";
import { useFetchApplications } from "@app/queries/applications";
import {
  useDeleteBusinessServiceMutation,
  useFetchBusinessServices,
} from "@app/queries/businessservices";
import { NotificationsContext } from "@app/components/NotificationsContext";
import { AppTableActionButtons } from "@app/components/AppTableActionButtons";
import { ConditionalRender } from "@app/components/ConditionalRender";
import { AppPlaceholder } from "@app/components/AppPlaceholder";
import { ConfirmDialog } from "@app/components/ConfirmDialog";
import { useLocalTableControls } from "@app/hooks/table-controls";
import { SimplePagination } from "@app/components/SimplePagination";
import {
  TableHeaderContentWithControls,
  ConditionalTableBody,
  TableRowContentWithControls,
} from "@app/components/TableControls";
import { CubesIcon } from "@patternfly/react-icons";

export const BusinessServices: React.FC = () => {
  const { t } = useTranslation();
  const { pushNotification } = React.useContext(NotificationsContext);

  const [isConfirmDialogOpen, setIsConfirmDialogOpen] =
    React.useState<boolean>(false);

  const [businessServiceToDelete, setBusinessServiceToDelete] =
    React.useState<BusinessService>();

  const [createUpdateModalState, setCreateUpdateModalState] = React.useState<
    "create" | BusinessService | null
  >(null);
  const isCreateUpdateModalOpen = createUpdateModalState !== null;
  const businessServiceToUpdate =
    createUpdateModalState !== "create" ? createUpdateModalState : null;

  const onDeleteBusinessServiceSuccess = () => {
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

  const tableControls = useLocalTableControls({
    tableName: "business-services-table",
    idProperty: "name",
    items: businessServices,
    columnNames: {
      name: t("terms.name"),
      description: t("terms.description"),
      owner: t("terms.owner"),
    },
    isFilterEnabled: true,
    isSortEnabled: true,
    isPaginationEnabled: true,
    hasActionsColumn: true,
    filterCategories: [
      {
        categoryKey: "name",
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
        categoryKey: "description",
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
        categoryKey: "owner",
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
    ],
    initialItemsPerPage: 10,
    sortableColumns: ["name", "description", "owner"],
    initialSort: { columnKey: "name", direction: "asc" },
    getSortValues: (item) => ({
      name: item?.name || "",
      description: item?.description || "",
      owner: item?.owner?.name || "",
    }),
    isLoading: isFetching,
  });

  const {
    currentPageItems,
    numRenderedColumns,
    propHelpers: {
      toolbarProps,
      filterToolbarProps,
      paginationToolbarItemProps,
      paginationProps,
      tableProps,
      getThProps,
      getTrProps,
      getTdProps,
    },
    expansionDerivedState: { isCellExpanded },
  } = tableControls;

  const deleteRow = (row: BusinessService) => {
    setBusinessServiceToDelete(row);
    setIsConfirmDialogOpen(true);
  };

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
        <div
          style={{
            backgroundColor: "var(--pf-v5-global--BackgroundColor--100)",
          }}
        >
          <Toolbar {...toolbarProps}>
            <ToolbarContent>
              <FilterToolbar {...filterToolbarProps} />
              <ToolbarGroup variant="button-group">
                <ToolbarItem>
                  <Button
                    type="button"
                    id="create-business-service"
                    aria-label="Create new business service"
                    variant={ButtonVariant.primary}
                    onClick={() => setCreateUpdateModalState("create")}
                  >
                    {t("actions.createNew")}
                  </Button>
                </ToolbarItem>
              </ToolbarGroup>
              <ToolbarItem {...paginationToolbarItemProps}>
                <SimplePagination
                  idPrefix="business-service-table"
                  isTop
                  paginationProps={paginationProps}
                />
              </ToolbarItem>
            </ToolbarContent>
          </Toolbar>
          <Table {...tableProps} aria-label="Business service table">
            <Thead>
              <Tr>
                <TableHeaderContentWithControls {...tableControls}>
                  <Th {...getThProps({ columnKey: "name" })} />
                  <Th {...getThProps({ columnKey: "description" })} />
                  <Th {...getThProps({ columnKey: "owner" })} />
                </TableHeaderContentWithControls>
              </Tr>
            </Thead>
            <ConditionalTableBody
              isLoading={isFetching}
              isError={!!fetchError}
              isNoData={currentPageItems.length === 0}
              noDataEmptyState={
                <EmptyState variant="sm">
                  <EmptyStateIcon icon={CubesIcon} />
                  <Title headingLevel="h2" size="lg">
                    {t("composed.noDataStateTitle", {
                      what: t("terms.businessService").toLowerCase(),
                    })}
                  </Title>
                  <EmptyStateBody>
                    {t("composed.noDataStateBody", {
                      how: t("terms.create"),
                      what: t("terms.businessService").toLowerCase(),
                    })}
                  </EmptyStateBody>
                </EmptyState>
              }
              numRenderedColumns={numRenderedColumns}
            >
              {currentPageItems?.map((businessService, rowIndex) => {
                const isAssignedToApplication = applications?.some(
                  (app) => app.businessService?.id === businessService.id
                );
                return (
                  <Tbody
                    key={businessService.id}
                    isExpanded={isCellExpanded(businessService)}
                  >
                    <Tr {...getTrProps({ item: businessService })}>
                      <TableRowContentWithControls
                        {...tableControls}
                        item={businessService}
                        rowIndex={rowIndex}
                      >
                        <Td width={25} {...getTdProps({ columnKey: "name" })}>
                          {businessService.name}
                        </Td>
                        <Td
                          width={10}
                          {...getTdProps({ columnKey: "description" })}
                        >
                          {businessService.description}
                        </Td>
                        <Td width={10} {...getTdProps({ columnKey: "owner" })}>
                          {businessService.owner?.name}
                        </Td>
                        <Td width={20}>
                          <AppTableActionButtons
                            isDeleteEnabled={isAssignedToApplication}
                            tooltipMessage="Cannot remove a business service associated with application(s)"
                            onEdit={() =>
                              setCreateUpdateModalState(businessService)
                            }
                            onDelete={() => deleteRow(businessService)}
                          />
                        </Td>
                      </TableRowContentWithControls>
                    </Tr>
                  </Tbody>
                );
              })}
            </ConditionalTableBody>
          </Table>
          <SimplePagination
            idPrefix="business-service-table"
            isTop={false}
            paginationProps={paginationProps}
          />
        </div>
      </ConditionalRender>

      <Modal
        id="create-edit-business-service-modal"
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
          title={t("dialog.title.deleteWithName", {
            what: t("terms.businessService").toLowerCase(),
            name: businessServiceToDelete?.name,
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
            if (businessServiceToDelete) {
              deleteBusinessService(businessServiceToDelete.id);
              setBusinessServiceToDelete(undefined);
            }
            setIsConfirmDialogOpen(false);
          }}
        />
      )}
    </>
  );
};
