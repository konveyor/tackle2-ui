import React, { useEffect, useState, useMemo, useCallback } from "react";
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
  Popover,
} from "@patternfly/react-core";
import { Table, Tbody, Th, Thead, Tr, Td } from "@patternfly/react-table";
import { CubesIcon, PencilAltIcon, TrashIcon } from "@patternfly/react-icons";
import { AppPlaceholder } from "@app/components/AppPlaceholder";
import { ConditionalRender } from "@app/components/ConditionalRender";
import { FilterToolbar, FilterType } from "@app/components/FilterToolbar";
import { NotificationsContext } from "@app/components/NotificationsContext";
import {
  ConditionalTableBody,
  TableHeaderContentWithControls,
  TableRowContentWithControls,
} from "@app/components/TableControls";
import { useLocalTableControls } from "@app/hooks/table-controls";
import { useDeleteGeneratorMutation } from "@app/queries/generators";
import { AssetGenerator, TaskState } from "@app/api/models";
import { ConfirmDialog } from "@app/components/ConfirmDialog";
import { getAxiosErrorMessage } from "@app/utils/utils";
import { AxiosError } from "axios";
import { SimplePagination } from "@app/components/SimplePagination";
import { TablePersistenceKeyPrefix } from "@app/Constants";
import { TaskStateIcon } from "@app/components/Icons";
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

// Static column configuration
const COLUMN_NAMES = {
  name: "terms.name",
  repository: "terms.repository",
  parameters: "terms.parameters",
  values: "terms.values",
};

const AssetGenerators: React.FC = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const { pushNotification } = React.useContext(NotificationsContext);

  const [openCreateGenerator, setOpenCreateGenerator] =
    useState<boolean>(false);

  const [generators, setGenerators] = useState<AssetGenerator[] | undefined>(
    undefined
  );

  const [generatorToEdit, setGeneratorToEdit] = useState<AssetGenerator | null>(
    null
  );

  const [generatorToDelete, setGeneratorToDelete] =
    React.useState<AssetGenerator | null>(null);

  const {
    generators: baseGenerators,
    isFetching,
    error: fetchError,
  } = useFetchGenerators();

  useEffect(() => {
    if (baseGenerators) {
      setGenerators(
        baseGenerators.map((generator) => ({
          ...generator,
          discoverApplicationsState: "No task" as TaskState,
        }))
      );
    }
  }, [baseGenerators]);

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
    (generatorDeleted: AssetGenerator) => {
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

  const columnNames = useMemo(
    () => ({
      name: t(COLUMN_NAMES.name),
      repository: t(COLUMN_NAMES.repository),
      parameters: t(COLUMN_NAMES.parameters),
      values: t(COLUMN_NAMES.values),
    }),
    [t]
  );

  const filterCategories = useMemo(
    () => [
      {
        categoryKey: "name",
        title: t("terms.name"),
        type: FilterType.search,
        placeholderText:
          t("actions.filterBy", {
            what: t("terms.name").toLowerCase(),
          }) + "...",
        getItemValue: (generator: AssetGenerator) => {
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
        getItemValue: (generator: AssetGenerator) => {
          return generator?.repository?.url ?? "";
        },
      },
    ],
    [t]
  );

  const getSortValues = useCallback(
    (generator: AssetGenerator) => ({
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
    isLoading: isFetching,
    hasActionsColumn: true,
    columnNames,
    isFilterEnabled: true,
    isSortEnabled: true,
    isPaginationEnabled: true,
    isActiveItemEnabled: true,
    filterCategories,
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

  const handleCreateGenerator = useCallback(() => {
    setOpenCreateGenerator(true);
  }, []);

  const handleCloseCreateGenerator = useCallback(() => {
    setOpenCreateGenerator(false);
  }, []);

  const handleEditGenerator = useCallback((generator: AssetGenerator) => {
    setGeneratorToEdit(generator);
  }, []);

  const handleCloseEditGenerator = useCallback(() => {
    setGeneratorToEdit(null);
  }, []);

  const handleDeleteGenerator = useCallback((generator: AssetGenerator) => {
    setGeneratorToDelete(generator);
  }, []);

  const handleCancelDelete = useCallback(() => {
    setGeneratorToDelete(null);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (generatorToDelete) {
      deleteGenerator(generatorToDelete);
      setGeneratorToDelete(null);
    }
  }, [generatorToDelete, deleteGenerator]);

  const CreateButton = useCallback(
    () => (
      <Button
        type="button"
        id="create-new-generator"
        aria-label="Create new generator"
        variant={ButtonVariant.primary}
        onClick={handleCreateGenerator}
      >
        {t("dialog.title.newGenerator")}
      </Button>
    ),
    [t, handleCreateGenerator]
  );

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
          when={isFetching && !(generators || fetchError)}
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
                    <CreateButton />
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
                isLoading={isFetching}
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
                        <Td {...getTdProps({ columnKey: "name" })}>
                          <Popover
                            headerContent={generator.name}
                            bodyContent={`discover applications for ${generator.name} status: ${generator.discoverApplicationsState}`}
                            headerIcon={
                              <TaskStateIcon
                                state={generator.discoverApplicationsState}
                              />
                            }
                            position="top"
                            id={`generator-name-popover-${generator.id}`}
                            triggerAction="hover"
                          >
                            <Text>{generator.name}</Text>
                          </Popover>
                        </Td>
                        <Td {...getTdProps({ columnKey: "repository" })}>
                          {generator?.repository?.url}
                        </Td>
                        <Td {...getTdProps({ columnKey: "parameters" })}>
                          {Object.keys(generator?.parameters || {}).length}
                        </Td>
                        <Td {...getTdProps({ columnKey: "values" })}>
                          {Object.keys(generator?.values || {}).length || 0}
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
        <GeneratorForm onClose={handleCloseCreateGenerator} />
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
