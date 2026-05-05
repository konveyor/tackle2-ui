import { FC, useCallback, useState } from "react";
import { AxiosError } from "axios";
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
import {
  CubesIcon,
  PencilAltIcon,
  PlayIcon,
  TrashIcon,
} from "@patternfly/react-icons";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";

import { TablePersistenceKeyPrefix } from "@app/Constants";
import { MigratorConfig, Taskgroup } from "@app/api/models";
import { createTaskgroup, submitTaskgroup } from "@app/api/rest";
import { AppPlaceholder } from "@app/components/AppPlaceholder";
import { ConditionalRender } from "@app/components/ConditionalRender";
import { ConfirmDialog } from "@app/components/ConfirmDialog";
import { FilterToolbar, FilterType } from "@app/components/FilterToolbar";
import { useNotifications } from "@app/components/NotificationsContext";
import { SimplePagination } from "@app/components/SimplePagination";
import {
  ConditionalTableBody,
  TableHeaderContentWithControls,
  TableRowContentWithControls,
} from "@app/components/TableControls";
import { useLocalTableControls } from "@app/hooks/table-controls";
import {
  useDeleteMigratorMutation,
  useFetchMigrators,
} from "@app/queries/migrators";
import { getAxiosErrorMessage } from "@app/utils/utils";

import MigratorDetailDrawer from "./components/migrator-detail-drawer";
import MigratorForm from "./components/migrator-form";

const Migrators: FC = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const { pushNotification } = useNotifications();

  const [openCreateMigrator, setOpenCreateMigrator] = useState<boolean>(false);
  const [migratorToEdit, setMigratorToEdit] = useState<MigratorConfig | null>(
    null
  );
  const [migratorToDelete, setMigratorToDelete] =
    useState<MigratorConfig | null>(null);
  const [migratorToRun, setMigratorToRun] = useState<MigratorConfig | null>(
    null
  );
  const [isRunning, setIsRunning] = useState(false);

  const { migrators, isLoading, fetchError } = useFetchMigrators();

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
    (migratorDeleted: MigratorConfig) => {
      pushNotification({
        title: `Successfully deleted migrator "${migratorDeleted.name}"`,
        variant: "success",
      });
    },
    [pushNotification]
  );

  const { mutate: deleteMigrator } = useDeleteMigratorMutation(
    onDeleteSuccess,
    onError
  );

  const handleRunMigration = useCallback(
    async (migrator: MigratorConfig) => {
      setIsRunning(true);
      try {
        const taskgroupPayload = {
          name: `migration-${migrator.name}-${Date.now()}`,
          kind: "migration",
          data: {
            sourceRepository: migrator.sourceRepository,
            assetRepository: migrator.assetRepository,
            migrationTarget: migrator.migrationTarget,
            pallet: migrator.pallet,
          },
          tasks: [] as Array<{
            name: string;
            data?: unknown;
            application: { id: number; name: string };
          }>,
        } as unknown as Taskgroup;

        const created = await createTaskgroup(taskgroupPayload);
        await submitTaskgroup(created);

        pushNotification({
          title: `Migration "${migrator.name}" submitted — TaskGroup #${created.id} (${created.state || "Ready"})`,
          variant: "success",
        });
      } catch (error) {
        pushNotification({
          title: `Failed to run migration: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          variant: "danger",
        });
      } finally {
        setIsRunning(false);
        setMigratorToRun(null);
      }
    },
    [pushNotification]
  );

  const getSortValues = useCallback(
    (migrator: MigratorConfig) => ({
      name: migrator.name ?? "",
      sourceRepo: migrator.sourceRepository?.url ?? "",
      assetRepo: migrator.assetRepository?.url ?? "",
      migrationTarget: migrator.migrationTarget ?? "",
    }),
    []
  );

  const tableControls = useLocalTableControls({
    tableName: "migrators-table",
    persistTo: "urlParams",
    persistenceKeyPrefix: TablePersistenceKeyPrefix.migrators,
    idProperty: "id",
    dataNameProperty: "name",
    items: migrators || [],
    isLoading: isLoading,
    hasActionsColumn: true,
    columnNames: {
      name: t("terms.name"),
      sourceRepo: "Source Repository",
      assetRepo: "Asset Repository",
      migrationTarget: "Migration Target",
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
        getItemValue: (migrator: MigratorConfig) => {
          return migrator?.name ?? "";
        },
      },
      {
        categoryKey: "sourceRepo",
        title: "Source Repository",
        type: FilterType.search,
        placeholderText: "Filter by source repository...",
        getItemValue: (migrator: MigratorConfig) => {
          return migrator?.sourceRepository?.url ?? "";
        },
      },
    ],
    sortableColumns: ["name", "sourceRepo", "assetRepo", "migrationTarget"],
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
          <Text component="h1">Migrators</Text>
        </TextContent>
      </PageSection>
      <PageSection>
        <ConditionalRender
          when={isLoading && !(migrators || fetchError)}
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
                      id="create-new-migrator"
                      aria-label="Create new migrator"
                      variant={ButtonVariant.primary}
                      onClick={() => setOpenCreateMigrator(true)}
                    >
                      New Migrator
                    </Button>
                  </ToolbarItem>
                </ToolbarGroup>
                <ToolbarItem {...paginationToolbarItemProps}>
                  <SimplePagination
                    idPrefix="migrators-table"
                    isTop
                    paginationProps={paginationProps}
                  />
                </ToolbarItem>
              </ToolbarContent>
            </Toolbar>

            <Table
              {...tableProps}
              id="migrators-table"
              aria-label="migrators table"
            >
              <Thead>
                <Tr>
                  <TableHeaderContentWithControls {...tableControls}>
                    <Th {...getThProps({ columnKey: "name" })} />
                    <Th {...getThProps({ columnKey: "sourceRepo" })} />
                    <Th {...getThProps({ columnKey: "assetRepo" })} />
                    <Th {...getThProps({ columnKey: "migrationTarget" })} />
                  </TableHeaderContentWithControls>
                </Tr>
              </Thead>
              <ConditionalTableBody
                isLoading={isLoading}
                isError={!!fetchError}
                isNoData={currentPageItems.length === 0}
                noDataEmptyState={
                  <EmptyState variant="sm">
                    <EmptyStateHeader
                      titleText="No migrators configured"
                      headingLevel="h2"
                      icon={<EmptyStateIcon icon={CubesIcon} />}
                    />
                    <EmptyStateBody>
                      Create a migrator to define source and asset repositories,
                      migration targets, and pallet configurations for running
                      AI-assisted migrations.
                    </EmptyStateBody>
                  </EmptyState>
                }
                numRenderedColumns={numRenderedColumns}
              >
                <Tbody>
                  {currentPageItems?.map((migrator, rowIndex) => (
                    <Tr key={migrator.id} {...getTrProps({ item: migrator })}>
                      <TableRowContentWithControls
                        {...tableControls}
                        item={migrator}
                        rowIndex={rowIndex}
                      >
                        <Td
                          {...getTdProps({ columnKey: "name" })}
                          modifier="truncate"
                        >
                          {migrator.name}
                        </Td>
                        <Td
                          {...getTdProps({ columnKey: "sourceRepo" })}
                          modifier="truncate"
                        >
                          {migrator.sourceRepository?.url}
                        </Td>
                        <Td
                          {...getTdProps({ columnKey: "assetRepo" })}
                          modifier="truncate"
                        >
                          {migrator.assetRepository?.url}
                        </Td>
                        <Td
                          {...getTdProps({ columnKey: "migrationTarget" })}
                          modifier="truncate"
                        >
                          {migrator.migrationTarget || "—"}
                        </Td>

                        <Td isActionCell id="run-action">
                          <Tooltip content="Run Migration">
                            <Button
                              variant="plain"
                              icon={<PlayIcon />}
                              onClick={() => setMigratorToRun(migrator)}
                            />
                          </Tooltip>
                        </Td>

                        <Td isActionCell id="pencil-action">
                          <Tooltip content={t("actions.edit")}>
                            <Button
                              variant="plain"
                              icon={<PencilAltIcon />}
                              onClick={() => setMigratorToEdit(migrator)}
                            />
                          </Tooltip>
                        </Td>

                        <Td isActionCell id="delete-action">
                          <Tooltip content={t("actions.delete")}>
                            <Button
                              variant="plain"
                              icon={<TrashIcon />}
                              onClick={() => setMigratorToDelete(migrator)}
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
              idPrefix="migrators-table"
              isTop={false}
              paginationProps={paginationProps}
            />
          </div>
        </ConditionalRender>
      </PageSection>

      <MigratorDetailDrawer
        migrator={activeItem}
        onCloseClick={clearActiveItem}
      />

      {/* Create modal */}
      <Modal
        title="New Migrator"
        variant="medium"
        isOpen={openCreateMigrator}
        onClose={() => setOpenCreateMigrator(false)}
      >
        <MigratorForm
          key={openCreateMigrator ? 1 : 0}
          onClose={() => setOpenCreateMigrator(false)}
        />
      </Modal>

      {/* Edit modal */}
      <Modal
        title="Edit Migrator"
        variant="medium"
        isOpen={!!migratorToEdit}
        onClose={() => setMigratorToEdit(null)}
      >
        <MigratorForm
          key={migratorToEdit?.id ?? -1}
          migrator={migratorToEdit}
          onClose={() => setMigratorToEdit(null)}
        />
      </Modal>

      {/* Run migration confirm modal */}
      <ConfirmDialog
        title={`Run Migration: ${migratorToRun?.name ?? ""}`}
        isOpen={!!migratorToRun}
        titleIconVariant="info"
        message={`This will create a TaskGroup and submit it to the Hub API, triggering the kai addon container to perform the migration.\n\nSource: ${migratorToRun?.sourceRepository?.url ?? ""}\nTarget: ${migratorToRun?.migrationTarget ?? "not specified"}\nAsset Output: ${migratorToRun?.assetRepository?.url ?? ""} (${migratorToRun?.assetRepository?.branch ?? ""})`}
        confirmBtnVariant={ButtonVariant.primary}
        confirmBtnLabel="Run Migration"
        cancelBtnLabel={t("actions.cancel")}
        onCancel={() => setMigratorToRun(null)}
        onClose={() => setMigratorToRun(null)}
        onConfirm={() => migratorToRun && handleRunMigration(migratorToRun)}
        inProgress={isRunning}
      />

      {/* Delete confirm modal */}
      <ConfirmDialog
        title={`Delete migrator "${migratorToDelete?.name ?? ""}"?`}
        isOpen={!!migratorToDelete}
        titleIconVariant="warning"
        message={t("dialog.message.delete")}
        confirmBtnVariant={ButtonVariant.danger}
        confirmBtnLabel={t("actions.delete")}
        cancelBtnLabel={t("actions.cancel")}
        onCancel={() => setMigratorToDelete(null)}
        onClose={() => setMigratorToDelete(null)}
        onConfirm={() => {
          if (migratorToDelete) {
            deleteMigrator(migratorToDelete);
            setMigratorToDelete(null);
          }
        }}
      />
    </>
  );
};

export default Migrators;
