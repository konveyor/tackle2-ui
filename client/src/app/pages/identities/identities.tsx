import React, { useState } from "react";
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
import { useEntityModal } from "@app/shared/hooks/useEntityModal";
import { AxiosError, AxiosResponse } from "axios";
import { NewIdentityModal } from "./components/new-identity-modal";
import { UpdateIdentityModal } from "./components/update-identity-modal";
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

const ENTITY_FIELD = "entity";

export const Identities: React.FC = () => {
  const { t } = useTranslation();

  const [isConfirmDialogOpen, setIsConfirmDialogOpen] =
    React.useState<Boolean>(false);

  const [identityIdToDelete, setIdentityIdToDelete] = React.useState<number>();

  const { pushNotification } = React.useContext(NotificationsContext);

  const [rowToUpdate, setRowToUpdate] = useState<Identity>();

  const onDeleteIdentitySuccess = (response: any) => {
    pushNotification({
      title: t("terms.credentialsDeleted"),
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

  // Create and update modal
  const {
    isOpen: isIdentityModalOpen,
    data: identityToUpdate,
    create: openCreateIdentityModal,
    update: openUpdateIdentityModal,
    close: closeIdentityModal,
  } = useEntityModal<Identity>();

  const {
    identities,
    isFetching,
    fetchError: fetchErrorIdentities,
  } = useFetchIdentities();

  const typeOptions: Array<ITypeOptions> = [
    { key: "source", value: "Source Control" },
    { key: "maven", value: "Maven Settings File" },
    { key: "proxy", value: "Proxy" },
    { key: "jira", value: "Jira" },
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

  const handleOnCancelUpdateIdentity = () => {
    setRowToUpdate(undefined);
  };

  const editRow = (row: Identity) => {
    setRowToUpdate(row);
  };

  const deleteRow = (row: Identity) => {
    setIdentityIdToDelete(row.id);
    setIsConfirmDialogOpen(true);
  };

  const handleOnIdentityCreated = (response: AxiosResponse<Identity>) => {
    if (!identityToUpdate) {
      pushNotification({
        title: t("toastr.success.save", {
          what: response.data.name,
          type: t("terms.credential"),
        }),
        variant: "success",
      });
    }

    closeIdentityModal();
  };

  const handleOnIdentityUpdated = () => {
    setRowToUpdate(undefined);
  };

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
              onEdit={() => editRow(item)}
              onDelete={() => deleteRow(item)}
            />
          ),
        },
      ],
    });
  });

  const dependentApplications = React.useMemo(() => {
    if (identityIdToDelete) {
      const res = applications?.filter((app) =>
        app?.identities?.map((id) => id.id).includes(identityIdToDelete)
      );
      return res;
    }
    return [];
  }, [applications, identityIdToDelete]);

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
                    onClick={openCreateIdentityModal}
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
                description={
                  t("composed.noDataStateBody", {
                    what: "credential",
                  }) + "."
                }
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
        <NewIdentityModal
          isOpen={isIdentityModalOpen}
          onSaved={handleOnIdentityCreated}
          onCancel={closeIdentityModal}
        />
        <UpdateIdentityModal
          identity={rowToUpdate}
          onSaved={handleOnIdentityUpdated}
          onCancel={handleOnCancelUpdateIdentity}
        />
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
            if (identityIdToDelete) {
              deleteIdentity(identityIdToDelete);
              setIdentityIdToDelete(undefined);
            }
            setIsConfirmDialogOpen(false);
          }}
        />
      )}
    </>
  );
};
