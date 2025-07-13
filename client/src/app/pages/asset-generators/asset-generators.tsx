import React, { useEffect, useState } from "react";
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
import {
  Table,
  Tbody,
  Th,
  Thead,
  Tr,
  Td,
  ActionsColumn,
} from "@patternfly/react-table";
import { CubesIcon, PencilAltIcon } from "@patternfly/react-icons";
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

  const onError = (error: AxiosError) => {
    pushNotification({
      title: getAxiosErrorMessage(error),
      variant: "danger",
    });
  };

  const { mutate: deleteGenerator } = useDeleteGeneratorMutation(
    (generatorDeleted: AssetGenerator) =>
      pushNotification({
        title: t("toastr.success.deletedWhat", {
          what: generatorDeleted.name,
          type: t("terms.generator"),
        }),
        variant: "success",
      }),
    onError
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
        getItemValue: (generator) => {
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
        getItemValue: (generator) => {
          return generator?.repository?.url ?? "";
        },
      },
    ],

    sortableColumns: ["name", "repository"],
    getSortValues: (generator) => ({
      name: generator.name ?? "",
      repository: generator.repository?.url ?? "",
    }),
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
  console.log("tableControls", tableControls);

  const CreateButton = () => (
    <Button
      type="button"
      id="create-new-generator"
      aria-label="Create new generator"
      variant={ButtonVariant.primary}
      onClick={() => setOpenCreateGenerator(true)}
    >
      {t("dialog.title.newGenerator")}
    </Button>
  );

  const clearFilters = () => {
    const currentPath = history.location.pathname;
    const newSearch = new URLSearchParams(history.location.search);
    newSearch.delete("filters");
    history.push(`${currentPath}`);
    filterToolbarProps.setFilterValues({});
  };

  const changeTaskStatus = (generatorId: number, newStatus: TaskState) => {
    setGenerators(
      generators?.map((generator) =>
        generator.id === generatorId
          ? { ...generator, discoverApplicationsState: newStatus }
          : generator
      )
    );
  };

  const discoverApplications = (generatorId: number) => {
    const generator = generators?.find((g) => g.id === generatorId);
    if (generator) {
      changeTaskStatus(generatorId, "Pending");
      // Simulate a task status change, in a real application this would be an API call
      setTimeout(() => {
        changeTaskStatus(generatorId, "Succeeded");
        pushNotification({
          title: t("toastr.success.discoverApplications", {
            generatorName: generator.name,
          }),
          variant: "success",
        });
      }, 2000); // Simulate a delay for the task completion
    }
  };
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
                noDataEmptyState={
                  <EmptyState variant="sm">
                    <EmptyStateHeader
                      titleText="No generators have been created"
                      headingLevel="h2"
                      icon={<EmptyStateIcon icon={CubesIcon} />}
                    />
                    <EmptyStateBody>
                      Create a new generator to get started.
                    </EmptyStateBody>
                  </EmptyState>
                }
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
                          {generator?.parameters?.length || 0}
                        </Td>
                        <Td {...getTdProps({ columnKey: "values" })}>
                          {generator?.values?.length || 0}
                        </Td>

                        <Td isActionCell id="pencil-action">
                          <Tooltip content={t("actions.edit")}>
                            <Button
                              variant="plain"
                              icon={<PencilAltIcon />}
                              onClick={() => setGeneratorToEdit(generator)}
                            />
                          </Tooltip>
                        </Td>

                        <Td isActionCell id="row-actions">
                          {/* Actions column */}
                          <ActionsColumn
                            items={[
                              ...[
                                {
                                  title: t("actions.discoverApplications"),
                                  onClick: () =>
                                    discoverApplications(generator.id),
                                },
                              ],
                              { isSeparator: true },
                              ...[
                                {
                                  title: t("actions.delete"),
                                  onClick: () =>
                                    setGeneratorToDelete(generator),
                                  isDanger: true,
                                },
                              ],
                            ]}
                          />
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
        onClose={() => setOpenCreateGenerator(false)}
      >
        <GeneratorForm onClose={() => setOpenCreateGenerator(false)} />
      </Modal>

      {/* Edit modal */}
      <Modal
        title={t("dialog.title.updateGenerator")}
        variant="medium"
        isOpen={!!generatorToEdit}
        onClose={() => setGeneratorToEdit(null)}
      >
        <GeneratorForm
          key={generatorToEdit?.id ?? -1}
          generator={generatorToEdit}
          onClose={() => setGeneratorToEdit(null)}
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
        onCancel={() => setGeneratorToDelete(null)}
        onClose={() => setGeneratorToDelete(null)}
        onConfirm={() => {
          if (generatorToDelete) {
            deleteGenerator(generatorToDelete);
            setGeneratorToDelete(null);
          }
        }}
      />
    </>
  );
};

export default AssetGenerators;
