import React, { useCallback, useEffect, useState } from "react";
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
  NoDataEmptyState,
} from "@app/shared/components";
import { Identity, ITypeOptions } from "@app/api/models";
import { useFilterState } from "@app/shared/hooks/useFilterState";
import { usePaginationState } from "@app/shared/hooks/usePaginationState";
import { useSortState } from "@app/shared/hooks/useSortState";
import { useEntityModal } from "@app/shared/hooks/useEntityModal";
import { AxiosError, AxiosResponse } from "axios";
import { useDispatch } from "react-redux";
import { alertActions } from "@app/store/alert";
import { confirmDialogActions } from "@app/store/confirmDialog";
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

const ENTITY_FIELD = "entity";

export const Identities: React.FunctionComponent = () => {
  const { t } = useTranslation();

  // Redux
  const dispatch = useDispatch();

  const [rowToUpdate, setRowToUpdate] = useState<Identity>();
  const onDeleteIdentitySuccess = (response: any) => {
    dispatch(confirmDialogActions.closeDialog());
  };

  const onDeleteIdentityError = (error: AxiosError) => {
    dispatch(confirmDialogActions.closeDialog());
    dispatch(alertActions.addDanger(getAxiosErrorMessage(error)));
  };

  const { mutate: deleteIdentity } = useDeleteIdentityMutation(
    onDeleteIdentitySuccess,
    onDeleteIdentityError
  );
  const { applications } = useFetchApplications();

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
  ];
  const filterCategories: FilterCategory<Identity>[] = [
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

  const { filterValues, setFilterValues, filteredItems } = useFilterState(
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
  const { sortBy, onSort, sortedItems } = useSortState(
    filteredItems,
    getSortValues
  );

  const { currentPageItems, setPageNumber, paginationProps } =
    usePaginationState(sortedItems, 10);

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
    const dependentApplications = applications.filter((app) => {
      const idList = app?.identities?.map((id) => id.id) || [];
      return idList.includes(row.id);
    });
    let dependencyExistsText;
    if (dependentApplications.length) {
      dependencyExistsText = `The credentials are being used by ${dependentApplications.length} applications. Deleting these credentials will also remove them from the associated applications. This action cannot be undone.`;
    }
    dispatch(
      confirmDialogActions.openDialog({
        title: "Delete credential",
        titleIconVariant: "warning",
        message: dependencyExistsText
          ? dependencyExistsText
          : "This cannot be undone.",
        confirmBtnVariant: ButtonVariant.danger,
        confirmBtnLabel: t("actions.delete"),
        cancelBtnLabel: t("actions.cancel"),
        onConfirm: () => {
          dispatch(confirmDialogActions.processing());
          deleteIdentity(row.id);
          if (currentPageItems.length === 1 && paginationProps.page) {
            setPageNumber(paginationProps.page - 1);
          } else {
            setPageNumber(1);
          }
        },
      })
    );
  };

  const handleOnIdentityCreated = (response: AxiosResponse<Identity>) => {
    if (!identityToUpdate) {
      dispatch(
        alertActions.addSuccess(
          t("toastr.success.added", {
            what: response.data.name,
            type: t("terms.identity").toLowerCase(),
          })
        )
      );
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
              <FilterToolbar<Identity>
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
    </>
  );
};
