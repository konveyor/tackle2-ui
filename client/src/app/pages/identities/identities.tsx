import React from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  ButtonVariant,
  PageSection,
  PageSectionVariants,
  TextContent,
  ToolbarGroup,
  ToolbarItem,
  Text,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  Title,
  Toolbar,
  ToolbarContent,
} from "@patternfly/react-core";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";

import { Identity, ITypeOptions } from "@app/api/models";
import { AxiosError } from "axios";
import { getAxiosErrorMessage } from "@app/utils/utils";
import { FilterToolbar, FilterType } from "@app/components/FilterToolbar";
import {
  useDeleteIdentityMutation,
  useFetchIdentities,
} from "@app/queries/identities";
import { useFetchApplications } from "@app/queries/applications";
import { NotificationsContext } from "@app/components/NotificationsContext";
import { IdentityFormModal } from "./components/identity-form";
import { useFetchTrackers } from "@app/queries/trackers";
import { AppTableActionButtons } from "@app/components/AppTableActionButtons";
import { ConditionalRender } from "@app/components/ConditionalRender";
import { AppPlaceholder } from "@app/components/AppPlaceholder";
import { ConfirmDialog } from "@app/components/ConfirmDialog";
import { useFetchTargets } from "@app/queries/targets";
import { SimplePagination } from "@app/components/SimplePagination";
import {
  TableHeaderContentWithControls,
  ConditionalTableBody,
  TableRowContentWithControls,
} from "@app/components/TableControls";
import { useLocalTableControls } from "@app/hooks/table-controls";
import { CubesIcon } from "@patternfly/react-icons";
import { DefaultLabel } from "./components/DefaultLabel";

export const TYPE_OPTIONS: Array<ITypeOptions> = [
  { key: "source", value: "Source Control" },
  { key: "maven", value: "Maven Settings File" },
  { key: "proxy", value: "Proxy" },
  { key: "basic-auth", value: "Basic Auth (Jira)" },
  { key: "bearer", value: "Bearer Token (Jira)" },
];

export const Identities: React.FC = () => {
  const { t } = useTranslation();

  const [isConfirmDialogOpen, setIsConfirmDialogOpen] =
    React.useState<boolean>(false);

  const [identityToDelete, setIdentityToDelete] = React.useState<Identity>();

  const { pushNotification } = React.useContext(NotificationsContext);

  const [createUpdateModalState, setCreateUpdateModalState] = React.useState<
    "create" | Identity | undefined
  >(undefined);
  const isCreateUpdateModalOpen = createUpdateModalState !== undefined;
  const identityToUpdate =
    createUpdateModalState !== "create" ? createUpdateModalState : undefined;

  const onDeleteIdentitySuccess = (identity: Identity) => {
    pushNotification({
      title: t("toastr.success.deletedWhat", {
        what: identity.name,
        type: t("terms.credential"),
      }),
      variant: "success",
    });
  };

  const onDeleteIdentityError = (error: AxiosError) => {
    pushNotification({
      title: getAxiosErrorMessage(error),
      variant: "danger",
    });
  };

  const { mutate: deleteIdentity } = useDeleteIdentityMutation(
    onDeleteIdentitySuccess,
    onDeleteIdentityError
  );

  const { targets } = useFetchTargets();
  const { data: applications } = useFetchApplications();
  const { trackers } = useFetchTrackers();

  const {
    identities,
    isFetching,
    fetchError: fetchErrorIdentities,
  } = useFetchIdentities(5_000);

  const getBlockDeleteMessage = (item: Identity) => {
    if (trackers.some((tracker) => tracker?.identity?.id === item.id)) {
      return t("message.blockedDeleteTracker", {
        what: item.name,
      });
    } else if (
      applications?.some((app) =>
        app?.identities?.some((id) => id.id === item.id)
      )
    ) {
      return t("message.blockedDeleteApplication", {
        what: item.name,
      });
    } else if (
      targets?.some((target) => target?.ruleset?.identity?.id === item.id)
    ) {
      return t("message.blockedDeleteTarget", {
        what: item.name,
      });
    } else {
      return t("message.defaultBlockedDelete", {
        what: item.name,
      });
    }
  };

  const dependentApplications = React.useMemo(() => {
    if (identityToDelete) {
      const res = applications?.filter((app) =>
        app?.identities?.map((id) => id.id).includes(identityToDelete.id)
      );
      return res;
    }
    return [];
  }, [applications, identityToDelete]);

  const tableControls = useLocalTableControls({
    tableName: "identities-table",
    idProperty: "id",
    dataNameProperty: "name",
    items: identities,
    columnNames: {
      name: t("terms.name"),
      default: "",
      description: t("terms.description"),
      type: t("terms.type"),
      createdBy: t("terms.createdBy"),
    },
    isFilterEnabled: true,
    isSortEnabled: true,
    isPaginationEnabled: true,
    hasActionsColumn: true,
    filterCategories: [
      {
        categoryKey: "name",
        title: "Name",
        type: FilterType.search,
        placeholderText: "Filter by name...",
        getItemValue: (item) => {
          return item?.name || "";
        },
      },
      {
        categoryKey: "type",
        title: "Type",
        type: FilterType.select,
        placeholderText: "Filter by type...",
        selectOptions: TYPE_OPTIONS.map(({ key, value }) => ({
          value: key,
          label: value,
        })),
        getItemValue: (item) => {
          return item.kind || "";
        },
      },
      {
        categoryKey: "createdBy",
        title: t("terms.createdBy"),
        type: FilterType.search,
        placeholderText: t("actions.filterBy", {
          what: t("terms.createdBy") + "...",
        }),
        getItemValue: (item: Identity) => {
          return item.createUser || "";
        },
      },
      {
        categoryKey: "",
        title: "Default credential",
        type: FilterType.select,
        placeholderText: "Filter by default...",
        selectOptions: [
          { value: "true", label: "Default" },
          { value: "false", label: "Not Default" },
        ],
        matcher: (filter, item) => {
          const matchDefault = filter === "true";
          return item.default === matchDefault;
        },
      },
    ],
    initialItemsPerPage: 10,
    sortableColumns: ["name", "type", "createdBy"],
    initialSort: { columnKey: "name", direction: "asc" },
    getSortValues: (item) => ({
      name: item?.name || "",
      type: item?.kind || "",
      createdBy: item?.createUser || "",
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
  } = tableControls;

  return (
    <>
      <PageSection variant={PageSectionVariants.light}>
        <TextContent>
          <Text component="h1">{t("terms.credentials")}</Text>
        </TextContent>
      </PageSection>
      <PageSection>
        <ConditionalRender
          when={isFetching && !(identities || fetchErrorIdentities)}
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
                      size="sm"
                      onClick={() => setCreateUpdateModalState("create")}
                      variant="primary"
                      id="create-credential-button"
                    >
                      Create new
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
                    <Th width={25} {...getThProps({ columnKey: "name" })} />
                    <Th />
                    <Th
                      width={25}
                      {...getThProps({ columnKey: "description" })}
                    />
                    <Th width={25} {...getThProps({ columnKey: "type" })} />
                    <Th {...getThProps({ columnKey: "createdBy" })} />
                    <Th screenReaderText="row actions" />
                  </TableHeaderContentWithControls>
                </Tr>
              </Thead>
              <ConditionalTableBody
                isLoading={isFetching}
                isError={!!fetchErrorIdentities}
                isNoData={currentPageItems.length === 0}
                noDataEmptyState={
                  <EmptyState variant="sm">
                    <EmptyStateIcon icon={CubesIcon} />
                    <Title headingLevel="h2" size="lg">
                      {t("composed.noDataStateTitle", {
                        what: t("terms.credential").toLowerCase(),
                      })}
                    </Title>
                    <EmptyStateBody>
                      {t("composed.noDataStateBody", {
                        how: t("terms.create"),
                        what: t("terms.credential").toLowerCase(),
                      })}
                    </EmptyStateBody>
                  </EmptyState>
                }
                numRenderedColumns={numRenderedColumns}
              >
                <Tbody>
                  {currentPageItems?.map((identity, rowIndex) => {
                    const typeFormattedString = TYPE_OPTIONS.find(
                      (type) => type.key === identity.kind
                    );
                    return (
                      <Tr
                        key={identity.name}
                        {...getTrProps({ item: identity })}
                      >
                        <TableRowContentWithControls
                          {...tableControls}
                          item={identity}
                          rowIndex={rowIndex}
                        >
                          <Td
                            modifier="truncate"
                            width={25}
                            {...getTdProps({ columnKey: "name" })}
                          >
                            {identity.name}
                          </Td>
                          <Td {...getTdProps({ columnKey: "default" })}>
                            <DefaultLabel identity={identity} />
                          </Td>
                          <Td
                            modifier="truncate"
                            width={25}
                            {...getTdProps({ columnKey: "description" })}
                          >
                            {identity.description}
                          </Td>
                          <Td
                            modifier="truncate"
                            width={20}
                            {...getTdProps({ columnKey: "type" })}
                          >
                            {typeFormattedString?.value}
                          </Td>
                          <Td
                            width={10}
                            {...getTdProps({ columnKey: "createdBy" })}
                          >
                            {identity.createUser}
                          </Td>
                          <AppTableActionButtons
                            isDeleteEnabled={
                              trackers.some(
                                (tracker) =>
                                  tracker?.identity?.id === identity.id
                              ) ||
                              applications?.some((app) =>
                                app?.identities?.some(
                                  (id) => id.id === identity.id
                                )
                              ) ||
                              targets?.some(
                                (target) =>
                                  target?.ruleset?.identity?.id === identity.id
                              )
                            }
                            tooltipMessage={getBlockDeleteMessage(identity)}
                            onEdit={() => setCreateUpdateModalState(identity)}
                            onDelete={() => {
                              setIdentityToDelete(identity);
                              setIsConfirmDialogOpen(true);
                            }}
                          />
                        </TableRowContentWithControls>
                      </Tr>
                    );
                  })}
                </Tbody>
              </ConditionalTableBody>
            </Table>
            <SimplePagination
              idPrefix="business-service-table"
              isTop={false}
              paginationProps={paginationProps}
            />
          </div>
        </ConditionalRender>

        <IdentityFormModal
          isOpen={isCreateUpdateModalOpen}
          identity={identityToUpdate}
          onClose={() => setCreateUpdateModalState(undefined)}
        />

        {isConfirmDialogOpen && (
          <ConfirmDialog
            title={t("dialog.title.deleteWithName", {
              what: t("terms.credential").toLowerCase(),
              name: identityToDelete?.name,
            })}
            titleIconVariant={"warning"}
            message={
              dependentApplications?.length
                ? t("confirmDeleteOfInUseCredentials", {
                    count: dependentApplications.length,
                  })
                : t("dialog.message.delete")
            }
            isOpen={true}
            confirmBtnVariant={ButtonVariant.danger}
            confirmBtnLabel={t("actions.delete")}
            cancelBtnLabel={t("actions.cancel")}
            onCancel={() => setIsConfirmDialogOpen(false)}
            onClose={() => setIsConfirmDialogOpen(false)}
            onConfirm={() => {
              if (identityToDelete) {
                deleteIdentity(identityToDelete);
                setIdentityToDelete(undefined);
              }
              setIsConfirmDialogOpen(false);
            }}
          />
        )}
      </PageSection>
    </>
  );
};
