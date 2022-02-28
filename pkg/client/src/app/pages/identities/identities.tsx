import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { deleteIdentity, getIdentities } from "@app/api/rest";
import {
  Button,
  ButtonVariant,
  Modal,
  PageSection,
  PageSectionVariants,
  Pagination,
  Text,
  TextContent,
  ToolbarItem,
} from "@patternfly/react-core";
import {
  cellWidth,
  expandable,
  ICell,
  IRow,
  sortable,
  Table,
  TableBody,
  TableHeader,
  TableText,
} from "@patternfly/react-table";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import {
  FilterToolbar,
  FilterType,
  FilterCategory,
} from "@app/shared/components/FilterToolbar";
import {
  AppTableActionButtons,
  NoDataEmptyState,
} from "@app/shared/components";
import { Identity } from "@app/api/models";
import { useFilterState } from "@app/shared/hooks/useFilterState";
import { usePaginationState } from "@app/shared/hooks/usePaginationState";
import { useSortState } from "@app/shared/hooks/useSortState";
import { useEntityModal } from "@app/shared/hooks/useEntityModal";
import { AxiosResponse } from "axios";
import { useDispatch } from "react-redux";
import { alertActions } from "@app/store/alert";
import { useDelete } from "@app/shared/hooks";
import { confirmDialogActions } from "@app/store/confirmDialog";
import { NewIdentityModal } from "./components/new-identity-modal";
import { UpdateIdentityModal } from "./components/update-identity-modal";
import { getAxiosErrorMessage } from "@app/utils/utils";
import { useFetchIdentities } from "@app/shared/hooks/useFetchIdentities";

const ENTITY_FIELD = "entity";

export const Identities: React.FunctionComponent = () => {
  const { t } = useTranslation();

  // Redux
  const dispatch = useDispatch();

  const [rowToUpdate, setRowToUpdate] = useState<Identity>();

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
    fetchError: fetchErrorIdentities,
    fetchIdentities,
  } = useFetchIdentities();

  useEffect(() => {
    fetchIdentities();
  }, [fetchIdentities]);

  const { requestDelete: requestDeleteIdentity } = useDelete<Identity>({
    onDelete: (t: Identity) => deleteIdentity(t.id!),
  });
  interface ITypeOptions {
    key: string;
    value: string;
  }

  const typeOptions: Array<ITypeOptions> = [
    { key: "scm", value: "Source Control" },
    { key: "mvn", value: "Maven Settings File" },
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
        return item.kind ? "Warm" : "Cold";
      },
    },
    {
      key: "createUser",
      title: "Created By",
      type: FilterType.search,
      placeholderText: "Filter by created by...",
      getItemValue: (item) => {
        return item.createUser || "";
      },
    },
  ];

  const { filterValues, setFilterValues, filteredItems } = useFilterState(
    identities?.data || [],
    filterCategories
  );
  const getSortValues = (identity: Identity) => [
    identity?.name || "",
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
    dispatch(
      confirmDialogActions.openDialog({
        title: "Delete identity",
        titleIconVariant: "warning",
        message: t("dialog.message.delete"),
        confirmBtnVariant: ButtonVariant.danger,
        confirmBtnLabel: t("actions.delete"),
        cancelBtnLabel: t("actions.cancel"),
        onConfirm: () => {
          dispatch(confirmDialogActions.processing());
          requestDeleteIdentity(
            row,
            () => {
              dispatch(confirmDialogActions.closeDialog());
              fetchIdentities();
            },
            (error) => {
              dispatch(confirmDialogActions.closeDialog());
              dispatch(alertActions.addDanger(getAxiosErrorMessage(error)));
            }
          );
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
    fetchIdentities();
  };

  const handleOnIdentityUpdated = () => {
    setRowToUpdate(undefined);
    fetchIdentities();
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
          title: <TableText wrapModifier="truncate">John Doe</TableText>,
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
        <FilterToolbar<Identity>
          filterCategories={filterCategories}
          filterValues={filterValues}
          setFilterValues={setFilterValues}
          endToolbarItems={
            <>
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
            </>
          }
          pagination={
            <Pagination
              className={spacing.mtMd}
              {...paginationProps}
              widgetId="plans-table-pagination-top"
            />
          }
        />
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

        {identities && identities?.data.length > 0 ? (
          <Table
            aria-label="Credentials table"
            cells={columns}
            rows={rows}
            sortBy={sortBy}
            onSort={onSort}
          >
            <TableHeader />
            <TableBody />
          </Table>
        ) : (
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
        )}
        <Pagination
          {...paginationProps}
          widgetId="plans-table-pagination-bottom"
          variant="bottom"
        />
      </PageSection>
    </>
  );
};
