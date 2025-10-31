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
import {
  useDeletePlatformMutation,
  useFetchPlatforms,
} from "@app/queries/platforms";

import LinkToPlatformApplications from "./components/link-to-platform-applications";
import PlatformDetailDrawer from "./components/platform-detail-drawer";
import PlatformForm from "./components/platform-form";
import { SourcePlatform, TaskState } from "@app/api/models";
import { ConfirmDialog } from "@app/components/ConfirmDialog";
import { getAxiosErrorMessage } from "@app/utils/utils";
import { AxiosError } from "axios";
import { SimplePagination } from "@app/components/SimplePagination";
import { TablePersistenceKeyPrefix } from "@app/Constants";
import { TaskStateIcon } from "@app/components/Icons";

const SourcePlatforms: React.FC = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const { pushNotification } = React.useContext(NotificationsContext);

  const [openCreatePlatform, setOpenCreatePlatform] = useState<boolean>(false);

  const [platforms, setPlatforms] = useState<SourcePlatform[] | undefined>(
    undefined
  );

  const [platformToEdit, setPlatformToEdit] = useState<SourcePlatform | null>(
    null
  );

  const [platformToDelete, setPlatformToDelete] =
    React.useState<SourcePlatform | null>(null);

  const {
    platforms: basePlatforms,
    isFetching,
    error: fetchError,
  } = useFetchPlatforms();

  useEffect(() => {
    if (basePlatforms) {
      setPlatforms(
        basePlatforms.map((platform) => ({
          ...platform,
          discoverApplicationsState: "No task" as TaskState,
        }))
      );
    }
  }, [basePlatforms]);

  const onError = (error: AxiosError) => {
    pushNotification({
      title: getAxiosErrorMessage(error),
      variant: "danger",
    });
  };

  const { mutate: deletePlatform } = useDeletePlatformMutation(
    (platformDeleted) =>
      pushNotification({
        title: t("toastr.success.deletedWhat", {
          what: platformDeleted.name,
          type: t("terms.platform"),
        }),
        variant: "success",
      }),
    onError
  );

  const tableControls = useLocalTableControls({
    tableName: "platforms-table",
    persistTo: "urlParams",
    persistenceKeyPrefix: TablePersistenceKeyPrefix.platforms,
    idProperty: "id",
    dataNameProperty: "name",
    items: platforms || [],
    isLoading: isFetching,
    hasActionsColumn: true,

    columnNames: {
      name: t("terms.name"),
      providerType: t("terms.providerType"),
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
        categoryKey: "providerType",
        title: t("terms.providerType"),
        type: FilterType.search,
        placeholderText:
          t("actions.filterBy", {
            what: t("terms.providerType").toLowerCase(),
          }) + "...",
        getItemValue: (platform) => {
          return platform?.kind ?? "";
        },
      },
    ],

    sortableColumns: ["name", "providerType", "applications"],
    getSortValues: (platform) => ({
      name: platform.name ?? "",
      providerType: platform.kind ?? "",
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

  const changeTaskStatus = (platformId: number, newStatus: TaskState) => {
    setPlatforms(
      platforms?.map((platform) =>
        platform.id === platformId
          ? { ...platform, discoverApplicationsState: newStatus }
          : platform
      )
    );
  };

  const discoverApplications = (platformId: number) => {
    const platform = platforms?.find((p) => p.id === platformId);
    if (platform) {
      changeTaskStatus(platformId, "Pending");
      // Simulate a task status change, in a real application this would be an API call
      setTimeout(() => {
        changeTaskStatus(platformId, "Succeeded");
        pushNotification({
          title: t("toastr.success.discoverApplications", {
            platformName: platform.name,
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
          <Text component="h1">{t("terms.sourcePlatforms")}</Text>
        </TextContent>
      </PageSection>
      <PageSection>
        <ConditionalRender
          when={isFetching && !(platforms || fetchError)}
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
                    <Th {...getThProps({ columnKey: "providerType" })} />
                    <Th {...getThProps({ columnKey: "applications" })} />
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
                          <Popover
                            headerContent={platform.name}
                            bodyContent={`discover applications for ${platform.name} status: ${platform.discoverApplicationsState}`}
                            headerIcon={
                              <TaskStateIcon
                                state={platform.discoverApplicationsState}
                              />
                            }
                            position="top"
                            id={`platform-name-popover-${platform.id}`}
                            triggerAction="hover"
                          >
                            <Text>{platform.name}</Text>
                          </Popover>
                        </Td>
                        <Td {...getTdProps({ columnKey: "providerType" })}>
                          {platform.kind}
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
                          {/* Actions column */}
                          <ActionsColumn
                            items={[
                              ...[
                                {
                                  title: t("actions.discoverApplications"),
                                  onClick: () =>
                                    discoverApplications(platform.id),
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
