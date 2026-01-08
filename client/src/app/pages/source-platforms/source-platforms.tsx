import { useState } from "react";
import * as React from "react";
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
import { CubesIcon, PencilAltIcon } from "@patternfly/react-icons";
import {
  ActionsColumn,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@patternfly/react-table";

import { TablePersistenceKeyPrefix } from "@app/Constants";
import { SourcePlatform } from "@app/api/models";
import { AppPlaceholder } from "@app/components/AppPlaceholder";
import { ConditionalRender } from "@app/components/ConditionalRender";
import { ConfirmDialog } from "@app/components/ConfirmDialog";
import { FilterToolbar, FilterType } from "@app/components/FilterToolbar";
import { NotificationsContext } from "@app/components/NotificationsContext";
import { SimplePagination } from "@app/components/SimplePagination";
import {
  ConditionalTableBody,
  TableHeaderContentWithControls,
  TableRowContentWithControls,
} from "@app/components/TableControls";
import { DiscoverImportWizard } from "@app/components/discover-import-wizard";
import { useLocalTableControls } from "@app/hooks/table-controls";
import { usePlatformKindList } from "@app/hooks/usePlatformKindList";
import { useDeletePlatformMutation } from "@app/queries/platforms";
import { getAxiosErrorMessage } from "@app/utils/utils";

import { ColumnPlatformName } from "./components/column-platform-name";
import LinkToPlatformApplications from "./components/link-to-platform-applications";
import PlatformDetailDrawer from "./components/platform-detail-drawer";
import { PlatformForm } from "./components/platform-form";
import { useFetchPlatformsWithTasks } from "./useFetchPlatformsWithTasks";

export const SourcePlatforms: React.FC = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const { pushNotification } = React.useContext(NotificationsContext);

  const { getDisplayLabel } = usePlatformKindList();

  const [openCreatePlatform, setOpenCreatePlatform] = useState<boolean>(false);

  const [platformToEdit, setPlatformToEdit] = useState<SourcePlatform | null>(
    null
  );

  const [platformToDelete, setPlatformToDelete] =
    useState<SourcePlatform | null>(null);

  const [platformToDiscoverImport, setPlatformToDiscoverImport] =
    useState<SourcePlatform | null>(null);

  const isModalOpen =
    openCreatePlatform ||
    !!platformToEdit ||
    !!platformToDelete ||
    !!platformToDiscoverImport;

  const {
    platforms,
    isLoading,
    error: fetchError,
  } = useFetchPlatformsWithTasks(isModalOpen);

  const { mutate: deletePlatform } = useDeletePlatformMutation(
    (platformDeleted) =>
      pushNotification({
        title: t("toastr.success.deletedWhat", {
          what: platformDeleted.name,
          type: t("terms.platform"),
        }),
        variant: "success",
      }),
    (error) => {
      pushNotification({
        title: getAxiosErrorMessage(error),
        variant: "danger",
      });
    }
  );

  const tableControls = useLocalTableControls({
    tableName: "platforms-table",
    persistTo: "urlParams",
    persistenceKeyPrefix: TablePersistenceKeyPrefix.platforms,
    idProperty: "id",
    dataNameProperty: "name",
    items: platforms || [],
    isLoading,
    hasActionsColumn: true,

    columnNames: {
      name: t("terms.name"),
      platformKind: t("terms.platformKind"),
      applications: t("terms.applications"),
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
        getItemValue: (platform) => {
          return platform?.name ?? "";
        },
      },
      {
        categoryKey: "platformKind",
        title: t("terms.platformKind"),
        type: FilterType.search,
        placeholderText:
          t("actions.filterBy", {
            what: t("terms.platformKind").toLowerCase(),
          }) + "...",
        getItemValue: (platform) => {
          return getDisplayLabel(platform?.kind) ?? "";
        },
      },
    ],

    sortableColumns: ["name", "platformKind", "applications"],
    getSortValues: (platform) => ({
      name: platform.name ?? "",
      platformKind: platform.kind ?? "",
      applications: platform.applications?.length ?? 0,
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

  const CreateButton = () => (
    <Button
      type="button"
      id="create-new-source-platform"
      aria-label="Create new platform"
      variant={ButtonVariant.primary}
      onClick={() => setOpenCreatePlatform(true)}
    >
      {t("dialog.title.newPlatform")}
    </Button>
  );

  const clearFilters = () => {
    const currentPath = history.location.pathname;
    const newSearch = new URLSearchParams(history.location.search);
    newSearch.delete("filters");
    history.push(`${currentPath}`);
    filterToolbarProps.setFilterValues({});
  };

  const discoverImport = (platform: SourcePlatform) => {
    if (platform) {
      setPlatformToDiscoverImport(platform);
    }
  };

  return (
    <>
      <PageSection variant={PageSectionVariants.light}>
        <TextContent>
          <Text component="h1">{t("terms.sourcePlatforms")}</Text>
        </TextContent>
      </PageSection>
      <PageSection>
        <ConditionalRender
          when={isLoading && !(platforms || fetchError)}
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
                    idPrefix="platforms-table"
                    isTop
                    paginationProps={paginationProps}
                  />
                </ToolbarItem>
              </ToolbarContent>
            </Toolbar>

            <Table
              {...tableProps}
              id="platforms-table"
              aria-label="platforms table"
            >
              <Thead>
                <Tr>
                  <TableHeaderContentWithControls {...tableControls}>
                    <Th {...getThProps({ columnKey: "name" })} />
                    <Th {...getThProps({ columnKey: "platformKind" })} />
                    <Th {...getThProps({ columnKey: "applications" })} />
                    <Th screenReaderText="primary action" />
                    <Th screenReaderText="secondary actions" />
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
                      titleText="No platforms have been created"
                      headingLevel="h2"
                      icon={<EmptyStateIcon icon={CubesIcon} />}
                    />
                    <EmptyStateBody>
                      Create a new platform to get started.
                    </EmptyStateBody>
                  </EmptyState>
                }
                numRenderedColumns={numRenderedColumns}
              >
                <Tbody>
                  {currentPageItems?.map((platform, rowIndex) => (
                    <Tr key={platform.id} {...getTrProps({ item: platform })}>
                      <TableRowContentWithControls
                        {...tableControls}
                        item={platform}
                        rowIndex={rowIndex}
                      >
                        <Td {...getTdProps({ columnKey: "name" })}>
                          <ColumnPlatformName platform={platform} />
                        </Td>
                        <Td {...getTdProps({ columnKey: "platformKind" })}>
                          {getDisplayLabel(platform.kind)}
                        </Td>
                        <Td {...getTdProps({ columnKey: "applications" })}>
                          <LinkToPlatformApplications platform={platform} />
                        </Td>

                        <Td isActionCell id="pencil-action">
                          <Tooltip content={t("actions.edit")}>
                            <Button
                              variant="plain"
                              icon={<PencilAltIcon />}
                              onClick={() => setPlatformToEdit(platform)}
                            />
                          </Tooltip>
                        </Td>
                        <Td isActionCell id="row-actions">
                          <ActionsColumn
                            items={[
                              ...[
                                {
                                  title: t("actions.discoverApplications"),
                                  onClick: () => discoverImport(platform),
                                },
                              ],
                              { isSeparator: true },
                              ...[
                                {
                                  title: t("actions.delete"),
                                  onClick: () => setPlatformToDelete(platform),
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
              idPrefix="platforms-table"
              isTop={false}
              paginationProps={paginationProps}
            />
          </div>
        </ConditionalRender>
      </PageSection>

      <PlatformDetailDrawer
        platform={activeItem}
        onCloseClick={clearActiveItem}
      />

      {/* Create modal */}
      <Modal
        title={t("dialog.title.newPlatform")}
        variant="medium"
        isOpen={openCreatePlatform}
        onClose={() => setOpenCreatePlatform(false)}
      >
        <PlatformForm onClose={() => setOpenCreatePlatform(false)} />
      </Modal>

      {/* Edit modal */}
      <Modal
        title={t("dialog.title.updatePlatform")}
        variant="medium"
        isOpen={!!platformToEdit}
        onClose={() => setPlatformToEdit(null)}
      >
        <PlatformForm
          key={platformToEdit?.id ?? -1}
          platform={platformToEdit}
          onClose={() => setPlatformToEdit(null)}
        />
      </Modal>

      {/* Platform Discover Import Wizard */}
      <DiscoverImportWizard
        platform={platformToDiscoverImport ?? undefined}
        isOpen={!!platformToDiscoverImport}
        onClose={() => {
          setPlatformToDiscoverImport(null);
        }}
      />

      {/* Delete confirm modal */}
      <ConfirmDialog
        title={t("dialog.title.deleteWithName", {
          what: t("terms.platform").toLowerCase(),
          name: platformToDelete?.name,
        })}
        isOpen={!!platformToDelete}
        titleIconVariant="warning"
        message={t("dialog.message.delete")}
        confirmBtnVariant={ButtonVariant.danger}
        confirmBtnLabel={t("actions.delete")}
        cancelBtnLabel={t("actions.cancel")}
        onCancel={() => setPlatformToDelete(null)}
        onClose={() => setPlatformToDelete(null)}
        onConfirm={() => {
          if (platformToDelete) {
            deletePlatform(platformToDelete);
            setPlatformToDelete(null);
          }
        }}
      />
    </>
  );
};

export default SourcePlatforms;
