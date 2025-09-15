import React, { useMemo } from "react";
import { AxiosError } from "axios";
import { objectify } from "radash";
import { Trans, useTranslation } from "react-i18next";
import {
  Button,
  ButtonVariant,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  PageSection,
  PageSectionVariants,
  Text,
  TextContent,
  Title,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
  Tooltip,
} from "@patternfly/react-core";
import { CubesIcon, PencilAltIcon } from "@patternfly/react-icons";
import {
  ActionsColumn,
  IAction,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@patternfly/react-table";

import { Identity, IdentityKind } from "@app/api/models";
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
import { useLocalTableControls } from "@app/hooks/table-controls";
import { useFetchApplications } from "@app/queries/applications";
import {
  useDeleteIdentityMutation,
  useFetchIdentities,
  useUpdateIdentityMutation,
} from "@app/queries/identities";
import { useFetchTargets } from "@app/queries/targets";
import { useFetchTrackers } from "@app/queries/trackers";
import { filterAndAddSeparator } from "@app/utils/grouping";
import { getAxiosErrorMessage } from "@app/utils/utils";

import { DefaultLabel } from "./components/DefaultLabel";
import { IdentityFormModal } from "./components/identity-form";
import { KIND_STRINGS, KIND_VALUES, lookupDefaults } from "./utils";

export const Identities: React.FC = () => {
  const { t } = useTranslation();

  const [identityToDelete, setIdentityToDelete] = React.useState<Identity>();
  const [identityToDefault, setIdentityToDefault] = React.useState<Identity>();
  const [identityToRemoveDefault, setIdentityToRemoveDefault] =
    React.useState<Identity>();

  const [createUpdateModalState, setCreateUpdateModalState] = React.useState<
    "create" | Identity | undefined
  >(undefined);

  const {
    identities,
    isFetching,
    fetchError: fetchErrorIdentities,
  } = useFetchIdentities(5_000);

  const {
    identityMeta,
    defaultIdentities,
    getDeleteTooltip,
    getDeleteConfirmMessage,
    doDeleteIdentity,
    doAssignDefaultIdentity,
    doRemoveDefaultIdentity,
  } = useIdentityMeta(identities);

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
        selectOptions: KIND_VALUES.map(({ key, value }) => ({
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

            <Table
              {...tableProps}
              id="identities-table"
              aria-label="Business service table"
            >
              <Thead>
                <Tr>
                  <TableHeaderContentWithControls {...tableControls}>
                    <Th width={25} {...getThProps({ columnKey: "name" })} />
                    <Th
                      aria-label="is credential the default"
                      {...getThProps({ columnKey: "default" })}
                    />
                    <Th
                      width={25}
                      {...getThProps({ columnKey: "description" })}
                    />
                    <Th width={25} {...getThProps({ columnKey: "type" })} />
                    <Th {...getThProps({ columnKey: "createdBy" })} />
                    <Th screenReaderText="primary action" />
                    <Th screenReaderText="secondary actions" />
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
                  {currentPageItems?.map((identity, rowIndex) => (
                    <Tr key={identity.name} {...getTrProps({ item: identity })}>
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
                        <Td
                          modifier="fitContent"
                          {...getTdProps({ columnKey: "default" })}
                        >
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
                          {KIND_VALUES.find(
                            (type) => type.key === identity.kind
                          )?.value ?? identity.kind}
                        </Td>
                        <Td
                          width={10}
                          {...getTdProps({ columnKey: "createdBy" })}
                        >
                          {identity.createUser}
                        </Td>

                        <Td isActionCell id="pencil-action">
                          <Tooltip content={t("actions.edit")}>
                            <Button
                              id="edit-action"
                              variant="plain"
                              icon={<PencilAltIcon />}
                              onClick={() =>
                                setCreateUpdateModalState(identity)
                              }
                            />
                          </Tooltip>
                        </Td>
                        <Td isActionCell id="row-actions">
                          <ActionsColumn
                            items={filterAndAddSeparator<IAction>(
                              (_index) => ({ isSeparator: true }),
                              [
                                [
                                  identityMeta[identity.id]
                                    .okToSetAsDefault && {
                                    title: t("actions.setAsDefault"),
                                    onClick: () => {
                                      if (defaultIdentities[identity.kind]) {
                                        setIdentityToDefault(identity);
                                      } else {
                                        // TODO: Maybe we want to confirm this first since it will
                                        //       rerun tech-discovery and language-discovery on all
                                        //       applications w/o credentials
                                        doAssignDefaultIdentity(identity);
                                      }
                                    },
                                  },

                                  identityMeta[identity.id]
                                    .okToRemoveDefault && {
                                    title: t("actions.removeDefault"),
                                    onClick: () => {
                                      setIdentityToRemoveDefault(identity);
                                    },
                                  },
                                ],
                                [
                                  {
                                    isDanger: true,
                                    title: t("actions.delete"),
                                    onClick: () => {
                                      setIdentityToDelete(identity);
                                    },
                                    isAriaDisabled:
                                      identityMeta[identity.id].inUse,
                                    tooltipProps: {
                                      content: getDeleteTooltip(identity),
                                    },
                                  },
                                ],
                              ]
                            )}
                          />
                        </Td>
                      </TableRowContentWithControls>
                    </Tr>
                  ))}
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
          isOpen={createUpdateModalState !== undefined}
          identity={
            createUpdateModalState === "create"
              ? undefined
              : createUpdateModalState
          }
          defaultIdentities={defaultIdentities}
          onClose={() => setCreateUpdateModalState(undefined)}
        />

        {identityToDelete ? (
          <ConfirmDialog
            title={t("dialog.title.deleteWithName", {
              what: t("terms.credential").toLowerCase(),
              name: identityToDelete.name,
            })}
            titleIconVariant={"warning"}
            message={getDeleteConfirmMessage(identityToDelete)}
            isOpen={true}
            confirmBtnVariant={ButtonVariant.danger}
            confirmBtnLabel={t("actions.delete")}
            cancelBtnLabel={t("actions.cancel")}
            onCancel={() => setIdentityToDelete(undefined)}
            onClose={() => setIdentityToDelete(undefined)}
            onConfirm={() => {
              doDeleteIdentity(identityToDelete);
              setIdentityToDelete(undefined);
            }}
          />
        ) : null}

        {identityToDefault ? (
          <ConfirmDialog
            title={t("credentials.confirm.setAsDefaultTitle", {
              name: identityToDefault.name,
            })}
            titleIconVariant={"warning"}
            message={
              <Trans
                i18nKey={"credentials.confirm.setAsDefaultMessage"}
                values={{
                  name: defaultIdentities[identityToDefault.kind]?.name,
                  typeString:
                    KIND_STRINGS[identityToDefault.kind] ??
                    identityToDefault.kind,
                }}
              />
            }
            isOpen={true}
            confirmBtnVariant={ButtonVariant.primary}
            confirmBtnLabel={t("actions.accept")}
            cancelBtnLabel={t("actions.cancel")}
            onCancel={() => setIdentityToDefault(undefined)}
            onClose={() => setIdentityToDefault(undefined)}
            onConfirm={() => {
              doAssignDefaultIdentity(identityToDefault);
              setIdentityToDefault(undefined);
            }}
          />
        ) : null}

        {identityToRemoveDefault ? (
          <ConfirmDialog
            title={t("credentials.confirm.removeDefaultTitle", {
              name: identityToRemoveDefault.name,
            })}
            titleIconVariant={"warning"}
            message={t("credentials.confirm.removeDefaultMessage", {
              typeString:
                KIND_STRINGS[identityToRemoveDefault.kind] ??
                identityToRemoveDefault.kind,
            })}
            isOpen={true}
            confirmBtnVariant={ButtonVariant.primary}
            confirmBtnLabel={t("actions.accept")}
            cancelBtnLabel={t("actions.cancel")}
            onCancel={() => setIdentityToRemoveDefault(undefined)}
            onClose={() => setIdentityToRemoveDefault(undefined)}
            onConfirm={() => {
              doRemoveDefaultIdentity(identityToRemoveDefault);
              setIdentityToRemoveDefault(undefined);
            }}
          />
        ) : null}
      </PageSection>
    </>
  );
};

const useIdentityMeta = (identities: Identity[]) => {
  const { t } = useTranslation();
  const { pushNotification } = React.useContext(NotificationsContext);
  const { trackers } = useFetchTrackers();
  const { targets } = useFetchTargets();
  const { data: applications } = useFetchApplications();

  const defaultIdentities: Record<IdentityKind, Identity | undefined> = useMemo(
    () => lookupDefaults(identities),
    [identities]
  );

  const identityMeta = objectify(
    identities,
    ({ id }) => id,
    ({ id, default: isDefault, kind }) => {
      const someTrackers = trackers.filter((t) => t.identity?.id === id).length;
      const someApplications = applications.filter((a) =>
        a.identities?.some((i) => i.id === id)
      ).length;
      const someTargets = targets.filter(
        (t) => t.ruleset?.identity?.id === id
      ).length;

      const okToSetAsDefault = !isDefault && ["source", "maven"].includes(kind);
      const okToRemoveDefault = isDefault && ["source", "maven"].includes(kind);

      return {
        id,
        someTrackers,
        someApplications,
        someTargets,
        inUse: someTrackers > 0 || someApplications > 0 || someTargets > 0,
        okToSetAsDefault,
        okToRemoveDefault,
      };
    }
  );

  const getDeleteTooltip = (item: Identity) => {
    const meta = identityMeta[item.id];
    if (!meta.inUse) {
      return undefined;
    }

    const inUseList = [
      meta.someApplications &&
        t("credentials.delete.application", { count: meta.someApplications }),
      meta.someTargets &&
        t("credentials.delete.target", { count: meta.someTargets }),
      meta.someTrackers &&
        t("credentials.delete.tracker", { count: meta.someTrackers }),
    ].filter(Boolean);

    return t("credentials.delete.warnDeleteInUse", {
      what: item.name,
      attached: inUseList,
    });
  };

  const getDeleteConfirmMessage = (item: Identity) => {
    const meta = identityMeta[item.id];
    if (!meta.inUse) {
      return t("dialog.message.delete");
    }

    const inUseList = [
      meta.someApplications &&
        t("credentials.delete.application", { count: meta.someApplications }),
      meta.someTargets &&
        t("credentials.delete.target", { count: meta.someTargets }),
      meta.someTrackers &&
        t("credentials.delete.tracker", { count: meta.someTrackers }),
    ].filter(Boolean);

    return t("credentials.delete.deleteInUse", {
      attached: inUseList,
    });
  };

  const onMutationError = (error: AxiosError) => {
    pushNotification({
      title: getAxiosErrorMessage(error),
      variant: "danger",
    });
  };

  const { mutate: doDeleteIdentity } = useDeleteIdentityMutation(
    (identity: Identity) => {
      pushNotification({
        title: t("toastr.success.deletedWhat", {
          what: identity.name,
          type: t("terms.credential"),
        }),
        variant: "success",
      });
    },
    onMutationError
  );

  const { mutate: updateIdentity } = useUpdateIdentityMutation((identity) => {
    pushNotification({
      title: t("toastr.success.saveWhat", {
        what: identity.name,
        type: t("terms.credential"),
      }),
      variant: "success",
    });
  }, onMutationError);

  const { mutateAsync: updateIdentityAsync } = useUpdateIdentityMutation();

  const doAssignDefaultIdentity = async (newDefault: Identity) => {
    try {
      // Unset the existing default if necessary
      const existingDefault = defaultIdentities[newDefault.kind];
      if (existingDefault && existingDefault.id !== newDefault.id) {
        await updateIdentityAsync({ ...existingDefault, default: false });
      }

      updateIdentity({ ...newDefault, default: true });
    } catch (e) {
      onMutationError(e as AxiosError);
    }
  };

  const doRemoveDefaultIdentity = (identity: Identity) => {
    updateIdentity({ ...identity, default: false });
  };

  return {
    identityMeta,
    defaultIdentities,
    getDeleteTooltip,
    getDeleteConfirmMessage,
    doDeleteIdentity,
    doAssignDefaultIdentity,
    doRemoveDefaultIdentity,
  };
};
