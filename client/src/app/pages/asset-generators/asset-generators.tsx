import React, { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import {
  Button,
  ButtonVariant,
  EmptyState,
  EmptyStateBody,
  EmptyStateHeader,
  EmptyStateIcon,
  Modal,
  PageSection,
  PageSectionVariants,
  Text,
  TextContent,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
  Tooltip,
} from "@patternfly/react-core";
import { Table, Tbody, Th, Thead, Tr, Td } from "@patternfly/react-table";
import { CubesIcon, PencilAltIcon, TrashIcon } from "@patternfly/react-icons";
import { AppPlaceholder } from "@app/components/AppPlaceholder";
import { ConditionalRender } from "@app/components/ConditionalRender";
import { FilterToolbar, FilterType } from "@app/components/FilterToolbar";
import { useNotifications } from "@app/components/NotificationsContext";
import {
  ConditionalTableBody,
  TableHeaderContentWithControls,
  TableRowContentWithControls,
} from "@app/components/TableControls";
import { useLocalTableControls } from "@app/hooks/table-controls";
import { useDeleteGeneratorMutation } from "@app/queries/generators";
import { Generator } from "@app/api/models";
import { ConfirmDialog } from "@app/components/ConfirmDialog";
import { getAxiosErrorMessage } from "@app/utils/utils";
import { AxiosError } from "axios";
import { SimplePagination } from "@app/components/SimplePagination";
import { TablePersistenceKeyPrefix } from "@app/Constants";
import GeneratorDetailDrawer from "./components/generator-detail-drawer";
import GeneratorForm from "./components/generator-form";
import { useFetchGenerators } from "@app/queries/generators";

// Static empty state configuration
const NO_DATA_EMPTY_STATE = (
  <EmptyState variant="sm">
    <EmptyStateHeader
      titleText="No generators have been created"
      headingLevel="h2"
      icon={<EmptyStateIcon icon={CubesIcon} />}
    />
    <EmptyStateBody>Create a new generator to get started.</EmptyStateBody>
  </EmptyState>
);

const AssetGenerators: React.FC = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const { pushNotification } = useNotifications();

  const [openCreateGenerator, setOpenCreateGenerator] =
    useState<boolean>(false);

  const [generatorToEdit, setGeneratorToEdit] = useState<Generator | null>(
    null
  );

  const [generatorToDelete, setGeneratorToDelete] = useState<Generator | null>(
    null
  );

  const { generators, isLoading, fetchError } = useFetchGenerators();

  const onError = useCallback(
    (error: AxiosError) => {
      pushNotification({
        title: getAxiosErrorMessage(error),
        variant: "danger",
      });
    },
    [pushNotification]
  );

  const onDeleteSuccess = useCallback(
    (generatorDeleted: Generator) => {
      pushNotification({
        title: t("toastr.success.deletedWhat", {
          what: generatorDeleted.name,
          type: t("terms.generator"),
        }),
        variant: "success",
      });
    },
    [pushNotification, t]
  );

  const { mutate: deleteGenerator } = useDeleteGeneratorMutation(
    onDeleteSuccess,
    onError
  );

  const getSortValues = useCallback(
    (generator: Generator) => ({
      name: generator.name ?? "",
      repository: generator.repository?.url ?? "",
    }),
    []
  );

  const tableControls = useLocalTableControls({
    tableName: "generators-table",
    persistTo: "urlParams",
    persistenceKeyPrefix: TablePersistenceKeyPrefix.generators,
    idProperty: "id",
    dataNameProperty: "name",
    items: generators || [],
    isLoading: isLoading,
    hasActionsColumn: true,
    columnNames: {
      name: t("terms.name"),
      repository: t("terms.repository"),
      parameters: t("terms.parameters"),
      values: t("terms.values"),
    },
    isFilterEnabled: true,
    isSortEnabled: true,
    isPaginationEnabled: true,
    isActiveItemEnabled: true,
    filterCategories: [
      {
        categoryKey: "name",
        title: t("terms.name"),
        type: FilterType.search,
        placeholderText:
          t("actions.filterBy", {
            what: t("terms.name").toLowerCase(),
          }) + "...",
        getItemValue: (generator: Generator) => {
          return generator?.name ?? "";
        },
      },
      {
        categoryKey: "repository",
        title: t("terms.repository"),
        type: FilterType.search,
        placeholderText:
          t("actions.filterBy", {
            what: t("terms.repository").toLowerCase(),
          }) + "...",
        getItemValue: (generator: Generator) => {
          return generator?.repository?.url ?? "";
        },
      },
    ],
    sortableColumns: ["name", "repository"],
    getSortValues,
    initialSort: { columnKey: "name", direction: "asc" },
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
    activeItemDerivedState: { activeItem, clearActiveItem },
  } = tableControls;

  const handleCreateGenerator = () => {
    setOpenCreateGenerator(true);
  };

  const handleCloseCreateGenerator = () => {
    setOpenCreateGenerator(false);
  };

  const handleEditGenerator = (generator: Generator) => {
    setGeneratorToEdit(generator);
  };

  const handleCloseEditGenerator = () => {
    setGeneratorToEdit(null);
  };

  const handleDeleteGenerator = (generator: Generator) => {
    setGeneratorToDelete(generator);
  };

  const handleCancelDelete = () => {
    setGeneratorToDelete(null);
  };

  const handleConfirmDelete = () => {
    if (generatorToDelete) {
      deleteGenerator(generatorToDelete);
      setGeneratorToDelete(null);
    }
  };

  const clearFilters = useCallback(() => {
    const currentPath = history.location.pathname;
    const newSearch = new URLSearchParams(history.location.search);
    newSearch.delete("filters");
    history.push(`${currentPath}?${newSearch.toString()}`);
    filterToolbarProps.setFilterValues({});
  }, [history, filterToolbarProps]);

  return (
    <>
      <PageSection variant={PageSectionVariants.light}>
        <TextContent>
          <Text component="h1">{t("terms.generators")}</Text>
        </TextContent>
      </PageSection>
      <PageSection>
        <ConditionalRender
          when={isLoading && !(generators || fetchError)}
          then={<AppPlaceholder />}
        >
          <div
            style={{
              backgroundColor: "var(--pf-v5-global--BackgroundColor--100)",
            }}
          >
            <Toolbar {...toolbarProps} clearAllFilters={clearFilters}>
              <ToolbarContent>
                <FilterToolbar {...filterToolbarProps} />
                <ToolbarGroup variant="button-group">
                  <ToolbarItem>
                    <Button
                      type="button"
                      id="create-new-generator"
                      aria-label="Create new generator"
                      variant={ButtonVariant.primary}
                      onClick={handleCreateGenerator}
                    >
                      {t("dialog.title.newGenerator")}
                    </Button>
                  </ToolbarItem>
                </ToolbarGroup>
                <ToolbarItem {...paginationToolbarItemProps}>
                  <SimplePagination
                    idPrefix="generators-table"
                    isTop
                    paginationProps={paginationProps}
                  />
                </ToolbarItem>
              </ToolbarContent>
            </Toolbar>

            <Table
              {...tableProps}
              id="generators-table"
              aria-label="generators table"
            >
              <Thead>
                <Tr>
                  <TableHeaderContentWithControls {...tableControls}>
                    <Th {...getThProps({ columnKey: "name" })} />
                    <Th {...getThProps({ columnKey: "repository" })} />
                    <Th {...getThProps({ columnKey: "parameters" })} />
                    <Th {...getThProps({ columnKey: "values" })} />
                  </TableHeaderContentWithControls>
                </Tr>
              </Thead>
              <ConditionalTableBody
                isLoading={isLoading}
                isError={!!fetchError}
                isNoData={currentPageItems.length === 0}
                noDataEmptyState={NO_DATA_EMPTY_STATE}
                numRenderedColumns={numRenderedColumns}
              >
                <Tbody>
                  {currentPageItems?.map((generator, rowIndex) => (
                    <Tr key={generator.id} {...getTrProps({ item: generator })}>
                      <TableRowContentWithControls
                        {...tableControls}
                        item={generator}
                        rowIndex={rowIndex}
                      >
                        <Td
                          {...getTdProps({ columnKey: "name" })}
                          modifier="truncate"
                        >
                          {generator.name}
                        </Td>
                        <Td
                          {...getTdProps({ columnKey: "repository" })}
                          modifier="truncate"
                        >
                          {generator?.repository?.url}
                        </Td>
                        <Td {...getTdProps({ columnKey: "parameters" })}>
                          {Object.keys(generator?.parameters || {}).length}
                        </Td>
                        <Td {...getTdProps({ columnKey: "values" })}>
                          {Object.keys(generator?.values || {}).length}
                        </Td>

                        <Td isActionCell id="pencil-action">
                          <Tooltip content={t("actions.edit")}>
                            <Button
                              variant="plain"
                              icon={<PencilAltIcon />}
                              onClick={() => handleEditGenerator(generator)}
                            />
                          </Tooltip>
                        </Td>

                        <Td isActionCell id="delete-action">
                          <Tooltip content={t("actions.delete")}>
                            <Button
                              variant="plain"
                              icon={<TrashIcon />}
                              onClick={() => handleDeleteGenerator(generator)}
                              isDanger={true}
                            />
                          </Tooltip>
                        </Td>
                      </TableRowContentWithControls>
                    </Tr>
                  ))}
                </Tbody>
              </ConditionalTableBody>
            </Table>
            <SimplePagination
              idPrefix="generators-table"
              isTop={false}
              paginationProps={paginationProps}
            />
          </div>
        </ConditionalRender>
      </PageSection>

      <GeneratorDetailDrawer
        generator={activeItem}
        onCloseClick={clearActiveItem}
      />

      {/* Create modal */}
      <Modal
        title={t("dialog.title.newGenerator")}
        variant="medium"
        isOpen={openCreateGenerator}
        onClose={handleCloseCreateGenerator}
      >
        <GeneratorForm
          key={openCreateGenerator ? 1 : 0}
          onClose={handleCloseCreateGenerator}
        />
      </Modal>

      {/* Edit modal */}
      <Modal
        title={t("dialog.title.updateGenerator")}
        variant="medium"
        isOpen={!!generatorToEdit}
        onClose={handleCloseEditGenerator}
      >
        <GeneratorForm
          key={generatorToEdit?.id ?? -1}
          generator={generatorToEdit}
          onClose={handleCloseEditGenerator}
        />
      </Modal>

      {/* Delete confirm modal */}
      <ConfirmDialog
        title={t("dialog.title.deleteWithName", {
          what: t("terms.generator").toLowerCase(),
          name: generatorToDelete?.name,
        })}
        isOpen={!!generatorToDelete}
        titleIconVariant="warning"
        message={t("dialog.message.delete")}
        confirmBtnVariant={ButtonVariant.danger}
        confirmBtnLabel={t("actions.delete")}
        cancelBtnLabel={t("actions.cancel")}
        onCancel={handleCancelDelete}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
};

export default AssetGenerators;
