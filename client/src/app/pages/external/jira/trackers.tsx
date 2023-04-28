import * as React from "react";
import {
  Button,
  ButtonVariant,
  Modal,
  PageSection,
  PageSectionVariants,
  Text,
  TextContent,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
} from "@patternfly/react-core";
import { useTranslation } from "react-i18next";
import {
  AppPlaceholder,
  AppTableActionButtons,
  ConditionalRender,
  ConfirmDialog,
  ToolbarBulkSelector,
} from "@app/shared/components";
import {
  FilterToolbar,
  FilterType,
} from "@app/shared/components/FilterToolbar";
import {
  useDeleteJiraTrackerMutation,
  useFetchJiraTrackers,
} from "@app/queries/jiratrackers";
import {
  Tbody,
  Tr,
  Td,
  Thead,
  Th,
  TableComposable,
} from "@patternfly/react-table";
import { useTableControls } from "@app/shared/hooks/use-table-controls";
import { SimplePagination } from "@app/shared/components/simple-pagination";
import {
  ConditionalTableBody,
  TableHeaderContentWithControls,
  TableRowContentWithControls,
} from "@app/shared/components/table-controls";
import { InstanceForm } from "./instance-form";
import { JiraTracker } from "@app/api/models";
import { NotificationsContext } from "@app/shared/notifications-context";
import { getAxiosErrorMessage } from "@app/utils/utils";
import { AxiosError } from "axios";

export const JiraTrackers: React.FC = () => {
  const { t } = useTranslation();
  const { pushNotification } = React.useContext(NotificationsContext);

  const [isInstanceModalOpen, setInstanceModalOpen] = React.useState(false);
  const [instanceToUpdate, setInstanceToUpdate] = React.useState<JiraTracker>();
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = React.useState(false);
  const [instanceToDelete, setInstanceToDelete] = React.useState<
    { id: number; name: string } | undefined
  >();

  const { jiraTrackers, isFetching, fetchError, refetch } =
    useFetchJiraTrackers();

  const onDeleteInstanceSuccess = (name: string) => {
    pushNotification({
      title: t("toastr.success.deleted", {
        what: name,
        type: t("terms.instance"),
      }),
      variant: "success",
    });
  };

  const onDeleteInstanceError = (error: AxiosError) => {
    pushNotification({
      title: getAxiosErrorMessage(error),
      variant: "danger",
    });
    refetch();
  };

  const { mutate: deleteInstance } = useDeleteJiraTrackerMutation(
    onDeleteInstanceSuccess,
    onDeleteInstanceError
  );

  const tableControls = useTableControls({
    idProperty: "name",
    items: jiraTrackers,
    columnNames: {
      name: "Instance name",
      url: "URL",
      kind: "Instance type",
    },
    isSelectable: true,
    filterCategories: [
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
    ],
    getSortValues: (jiraTracker) => ({
      name: jiraTracker.name || "",
      url: "", // TODO
    }),
    sortableColumns: ["name", "url"],
    hasPagination: true,
  });
  const {
    currentPageItems,
    numRenderedColumns,
    selectionState: { selectedItems },
    propHelpers: {
      toolbarProps,
      toolbarBulkSelectorProps,
      filterToolbarProps,
      paginationToolbarItemProps,
      paginationProps,
      tableProps,
      getThProps,
      getTdProps,
    },
  } = tableControls;

  return (
    <>
      <PageSection variant={PageSectionVariants.light}>
        <TextContent>
          <Text component="h1">{t("terms.jiraConfig")}</Text>
        </TextContent>
      </PageSection>
      <PageSection>
        <ConditionalRender
          when={isFetching && !(jiraTrackers || fetchError)}
          then={<AppPlaceholder />}
        >
          <div
            style={{
              backgroundColor: "var(--pf-global--BackgroundColor--100)",
            }}
          >
            <Toolbar {...toolbarProps}>
              <ToolbarContent>
                <ToolbarBulkSelector {...toolbarBulkSelectorProps} />
                <FilterToolbar {...filterToolbarProps} />
                <ToolbarGroup variant="button-group">
                  {/* <RBAC
                    allowedPermissions={[]}
                    rbacType={RBAC_TYPE.Scope}
                  > */}
                  <ToolbarItem>
                    <Button
                      type="button"
                      id="create-instance"
                      aria-label="Create new instance"
                      variant={ButtonVariant.primary}
                      onClick={() => setInstanceModalOpen(true)}
                    >
                      {t("actions.createNew")}
                    </Button>
                  </ToolbarItem>
                  {/* </RBAC> */}
                  {/* {jiraDropdownItems.length ? (
                    <ToolbarItem>
                      <KebabDropdown
                        dropdownItems={waveDropdownItems}
                      ></KebabDropdown>
                    </ToolbarItem>
                  ) : (
                    <></>
                  )} */}
                </ToolbarGroup>
                <ToolbarItem {...paginationToolbarItemProps}>
                  <SimplePagination
                    idPrefix="jira-instance-table"
                    isTop
                    paginationProps={paginationProps}
                  />
                </ToolbarItem>
              </ToolbarContent>
            </Toolbar>
            <TableComposable {...tableProps} aria-label="Jira trackers table">
              <Thead>
                <Tr>
                  <TableHeaderContentWithControls {...tableControls}>
                    <Th {...getThProps({ columnKey: "name" })} />
                    <Th {...getThProps({ columnKey: "url" })} />
                    <Th {...getThProps({ columnKey: "kind" })} />
                  </TableHeaderContentWithControls>
                </Tr>
              </Thead>
              <ConditionalTableBody
                isLoading={isFetching}
                isError={!!fetchError}
                isNoData={jiraTrackers.length === 0}
                numRenderedColumns={numRenderedColumns}
              >
                <Tbody>
                  {currentPageItems?.map((jiraTracker, rowIndex) => (
                    <Tr key={jiraTracker.name}>
                      <TableRowContentWithControls
                        {...tableControls}
                        item={jiraTracker}
                        rowIndex={rowIndex}
                      >
                        <Td width={10} {...getTdProps({ columnKey: "name" })}>
                          {jiraTracker.name}
                        </Td>
                        <Td width={20} {...getTdProps({ columnKey: "url" })}>
                          {jiraTracker.url}
                        </Td>
                        <Td width={10} {...getTdProps({ columnKey: "kind" })}>
                          {jiraTracker.kind}
                        </Td>
                        <Td width={20}>
                          <AppTableActionButtons
                            onEdit={() => {
                              setInstanceModalOpen(true);
                              setInstanceToUpdate(jiraTracker);
                            }}
                            onDelete={() => {
                              setInstanceToDelete({
                                id: jiraTracker.id,
                                name: jiraTracker.name,
                              });
                              setIsConfirmDialogOpen(true);
                            }}
                          />
                        </Td>
                      </TableRowContentWithControls>
                    </Tr>
                  ))}
                </Tbody>
              </ConditionalTableBody>
            </TableComposable>
          </div>
        </ConditionalRender>
      </PageSection>
      <Modal
        title={
          instanceToUpdate
            ? t("dialog.title.update", {
                what: t("terms.instance").toLowerCase(),
              })
            : t("dialog.title.new", {
                what: t("terms.instance").toLowerCase(),
              })
        }
        variant="medium"
        isOpen={isInstanceModalOpen}
        onClose={() => {
          setInstanceModalOpen(false);
          setInstanceToUpdate(undefined);
        }}
      >
        <InstanceForm
          instance={instanceToUpdate ? instanceToUpdate : undefined}
          onClose={() => {
            setInstanceModalOpen(false);
            setInstanceToUpdate(undefined);
          }}
        />
      </Modal>
      <ConfirmDialog
        title={t("dialog.title.delete", {
          what: t("terms.instance").toLowerCase(),
        })}
        isOpen={isConfirmDialogOpen}
        titleIconVariant={"warning"}
        message={t("dialog.message.delete")}
        confirmBtnVariant={ButtonVariant.danger}
        confirmBtnLabel={t("actions.delete")}
        cancelBtnLabel={t("actions.cancel")}
        onCancel={() => setIsConfirmDialogOpen(false)}
        onClose={() => setIsConfirmDialogOpen(false)}
        onConfirm={() => {
          if (instanceToDelete) {
            deleteInstance(instanceToDelete);
            setInstanceToDelete(undefined);
          }
          setIsConfirmDialogOpen(false);
        }}
      />
    </>
  );
};
