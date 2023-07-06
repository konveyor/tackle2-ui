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
  Modal,
  ModalVariant,
} from "@patternfly/react-core";
import {
  cellWidth,
  expandable,
  ICell,
  IRow,
  sortable,
  TableText,
} from "@patternfly/react-table";

import {
  AppPlaceholder,
  AppTableActionButtons,
  AppTableWithControls,
  ConditionalRender,
  ConfirmDialog,
  NoDataEmptyState,
} from "@app/shared/components";
import { Identity, ITypeOptions } from "@app/api/models";
import { useLegacyFilterState } from "@app/shared/hooks/useLegacyFilterState";
import { useLegacyPaginationState } from "@app/shared/hooks/useLegacyPaginationState";
import { useLegacySortState } from "@app/shared/hooks/useLegacySortState";
import { AxiosError } from "axios";
import { getAxiosErrorMessage } from "@app/utils/utils";
import {
  FilterCategory,
  FilterToolbar,
  FilterType,
} from "@app/shared/components/FilterToolbar";
import {
  useDeleteIdentityMutation,
  useFetchIdentities,
} from "@app/queries/identities";
import { useFetchApplications } from "@app/queries/applications";
import { NotificationsContext } from "@app/shared/notifications-context";
import { IdentityForm } from "./components/identity-form";
import { validateXML } from "./components/identity-form/validateXML";
import { useFetchTrackers } from "@app/queries/trackers";

const ENTITY_FIELD = "entity";

export const Identities: React.FC = () => {
  const { t } = useTranslation();

  const [isConfirmDialogOpen, setIsConfirmDialogOpen] =
    React.useState<Boolean>(false);

  const [identityToDelete, setIdentityToDelete] = React.useState<Identity>();

  const { pushNotification } = React.useContext(NotificationsContext);

  const [createUpdateModalState, setCreateUpdateModalState] = React.useState<
    "create" | Identity | null
  >(null);
  const isCreateUpdateModalOpen = createUpdateModalState !== null;
  const identityToUpdate =
    createUpdateModalState !== "create" ? createUpdateModalState : null;

  const onDeleteIdentitySuccess = (identityName: string) => {
    pushNotification({
      title: t("toastr.success.deletedWhat", {
        what: identityName,
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
  const { data: applications } = useFetchApplications();
  const { trackers } = useFetchTrackers();

  const {
    identities,
    isFetching,
    fetchError: fetchErrorIdentities,
  } = useFetchIdentities();

  const typeOptions: Array<ITypeOptions> = [
    { key: "source", value: "Source Control" },
    { key: "maven", value: "Maven Settings File" },
    { key: "proxy", value: "Proxy" },
    { key: "basic-auth", value: "JIRA Basic Auth" },
    { key: "bearer", value: "JIRA Bearer Token" },
  ];
  const filterCategories: FilterCategory<
    Identity,
    "name" | "type" | "createdBy"
  >[] = [
    {
      key: "name",
      title: "Name",
      type: FilterType.search,
      placeholderText: "Filter by name...",
      getItemValue: (item) => {
        return item?.name || "";
      },
    },
    {
      key: "type",
      title: "Type",
      type: FilterType.select,
      placeholderText: "Filter by type...",
      selectOptions: typeOptions,
      getItemValue: (item) => {
        return item.kind || "";
      },
    },
    {
      key: "createdBy",
      title: "Created By",
      type: FilterType.search,
      placeholderText: "Filter by created by User...",
      getItemValue: (item) => {
        return item.createUser || "";
      },
    },
  ];

  const { filterValues, setFilterValues, filteredItems } = useLegacyFilterState(
    identities || [],
    filterCategories
  );
  const getSortValues = (identity: Identity) => [
    identity?.name || "",
    "", // description column
    identity?.kind || "",
    identity?.createUser || "",
    "", // Action column
  ];
  const { sortBy, onSort, sortedItems } = useLegacySortState(
    filteredItems,
    getSortValues
  );

  const { currentPageItems, setPageNumber, paginationProps } =
    useLegacyPaginationState(sortedItems, 10);

  const columns: ICell[] = [
    {
      title: "Name",
      transforms: [sortable, cellWidth(20)],
      cellFormatters: [expandable],
    },
    { title: "Description", transforms: [cellWidth(25)] },
    { title: "Type", transforms: [sortable, cellWidth(20)] },
    { title: "Created by", transforms: [sortable, cellWidth(10)] },
    {
      title: "",
      props: {
        className: "pf-u-text-align-right",
      },
    },
  ];

  const handleOnClearAllFilters = () => {
    setFilterValues({});
  };

  const rows: IRow[] = [];
  currentPageItems?.forEach((item: Identity) => {
    const typeFormattedString = typeOptions.find(
      (type) => type.key === item.kind
    );
    rows.push({
      [ENTITY_FIELD]: item,
      cells: [
        {
          title: <TableText wrapModifier="truncate">{item.name}</TableText>,
        },
        {
          title: (
            <TableText wrapModifier="truncate">{item.description}</TableText>
          ),
        },
        {
          title: (
            <TableText wrapModifier="truncate">
              {typeFormattedString?.value}
            </TableText>
          ),
        },
        {
          title: (
            <TableText wrapModifier="truncate">{item.createUser}</TableText>
          ),
        },
        {
          title: (
            <AppTableActionButtons
              isDeleteEnabled={trackers.some(
                (tracker) => tracker?.identity?.id === item.id
              )}
              tooltipMessage={
                "Cannot delete credential assigned to a JIRA tracker."
              }
              onEdit={() => setCreateUpdateModalState(item)}
              onDelete={() => {
                setIdentityToDelete(item);
                setIsConfirmDialogOpen(true);
              }}
            />
          ),
        },
      ],
    });
  });

  const dependentApplications = React.useMemo(() => {
    if (identityToDelete) {
      const res = applications?.filter((app) =>
        app?.identities?.map((id) => id.id).includes(identityToDelete.id)
      );
      return res;
    }
    return [];
  }, [applications, identityToDelete]);

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
          <AppTableWithControls
            count={identities ? identities.length : 0}
            sortBy={sortBy}
            onSort={onSort}
            cells={columns}
            rows={rows}
            isLoading={isFetching}
            loadingVariant="skeleton"
            fetchError={fetchErrorIdentities}
            toolbarClearAllFilters={handleOnClearAllFilters}
            toolbarActions={
              <ToolbarGroup variant="button-group">
                <ToolbarItem>
                  <Button
                    isSmall
                    onClick={() => setCreateUpdateModalState("create")}
                    variant="primary"
                    id="create-credential-button"
                  >
                    Create new
                  </Button>
                </ToolbarItem>
              </ToolbarGroup>
            }
            noDataState={
              <NoDataEmptyState
                title={t("composed.noDataStateTitle", {
                  what: "credentials",
                })}
                description={t("composed.noDataStateBody", {
                  what: "credential",
                })}
              />
            }
            paginationProps={paginationProps}
            paginationIdPrefix="identities"
            toolbarToggle={
              <FilterToolbar
                filterCategories={filterCategories}
                filterValues={filterValues}
                setFilterValues={setFilterValues}
              />
            }
          />
        </ConditionalRender>

        <Modal
          id="credential.modal"
          title={
            identityToUpdate
              ? t("dialog.title.update", {
                  what: t("terms.credential").toLowerCase(),
                })
              : t("dialog.title.new", {
                  what: t("terms.credential").toLowerCase(),
                })
          }
          variant={ModalVariant.medium}
          isOpen={isCreateUpdateModalOpen}
          onClose={() => setCreateUpdateModalState(null)}
        >
          <IdentityForm
            identity={identityToUpdate ? identityToUpdate : undefined}
            onClose={() => setCreateUpdateModalState(null)}
            xmlValidator={validateXML}
          />
        </Modal>
      </PageSection>
      {isConfirmDialogOpen && (
        <ConfirmDialog
          title={t("dialog.title.delete", {
            what: t("terms.credential").toLowerCase(),
          })}
          titleIconVariant={"warning"}
          message={
            dependentApplications?.length
              ? `${`The credentials are being used by ${dependentApplications.length} application(s). Deleting these credentials will also remove them from the associated applications.`}
          ${t("dialog.message.delete")}`
              : `${t("dialog.message.delete")}`
          }
          isOpen={true}
          confirmBtnVariant={ButtonVariant.danger}
          confirmBtnLabel={t("actions.delete")}
          cancelBtnLabel={t("actions.cancel")}
          onCancel={() => setIsConfirmDialogOpen(false)}
          onClose={() => setIsConfirmDialogOpen(false)}
          onConfirm={() => {
            if (identityToDelete) {
              deleteIdentity({ identity: identityToDelete });
              setIdentityToDelete(undefined);
            }
            setIsConfirmDialogOpen(false);
          }}
        />
      )}
    </>
  );
};
