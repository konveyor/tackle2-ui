import React, { useState } from "react";
import { AxiosError, AxiosResponse } from "axios";
import { useTranslation } from "react-i18next";
import { useSelectionState } from "@migtools/lib-ui";

import {
  Button,
  ButtonVariant,
  ToolbarGroup,
  ToolbarItem,
} from "@patternfly/react-core";
import {
  expandable,
  ICell,
  IExtraData,
  IRow,
  IRowData,
  sortable,
} from "@patternfly/react-table";

import {
  AppPlaceholder,
  AppTableActionButtons,
  AppTableWithControls,
  ConditionalRender,
  NoDataEmptyState,
  Color,
  ConfirmDialog,
} from "@app/shared/components";
import { dedupeFunction, getAxiosErrorMessage } from "@app/utils/utils";
import { Tag, TagType } from "@app/api/models";

import { NewTagTypeModal } from "./components/new-tag-type-modal";
import { UpdateTagTypeModal } from "./components/update-tag-type-modal";
import { NewTagModal } from "./components/new-tag-modal";
import { UpdateTagModal } from "./components/update-tag-modal";
import { TagTable } from "./components/tag-table";
import { usePaginationState } from "@app/shared/hooks/usePaginationState";
import {
  FilterCategory,
  FilterToolbar,
  FilterType,
} from "@app/shared/components/FilterToolbar";
import { useFilterState } from "@app/shared/hooks/useFilterState";
import { useSortState } from "@app/shared/hooks/useSortState";
import { DEFAULT_COLOR_LABELS } from "@app/Constants";
import { controlsWriteScopes, RBAC, RBAC_TYPE } from "@app/rbac";
import {
  useDeleteTagMutation,
  useDeleteTagTypeMutation,
  useFetchTagTypes,
} from "@app/queries/tags";
import { NotificationsContext } from "@app/shared/notifications-context";

const ENTITY_FIELD = "entity";

const getRow = (rowData: IRowData): TagType => {
  return rowData[ENTITY_FIELD];
};

export const Tags: React.FC = () => {
  const { t } = useTranslation();

  const [isTagToDeleteConfirmDialogOpen, setIsTagToDeleteConfirmDialogOpen] =
    React.useState<Boolean>(false);

  const [
    isTagTypeToDeleteConfirmDialogOpen,
    setIsTagTypeToDeleteConfirmDialogOpen,
  ] = React.useState<Boolean>(false);

  const [tagIdToDelete, setTagIdToDelete] = React.useState<number>();
  const [tagTypeIdToDelete, setTagTypeIdToDelete] = React.useState<number>();

  const { pushNotification } = React.useContext(NotificationsContext);

  const [isNewTagTypeModalOpen, setIsNewTagTypeModalOpen] = useState(false);
  const [rowToUpdate, setRowToUpdate] = useState<TagType>();

  const [isNewTagModalOpen, setIsNewTagModalOpen] = useState(false);
  const [tagToUpdate, setTagToUpdate] = useState<Tag>();

  const onDeleteTagSuccess = (response: any) => {
    pushNotification({
      title: t("terms.tagDeleted"),
      variant: "success",
    });
    refetch();
  };

  const onDeleteTagError = (error: AxiosError) => {
    if (
      error.response?.status === 500 &&
      error.response?.data.error === "FOREIGN KEY constraint failed"
    ) {
      pushNotification({
        title: "Cannot delete a used tag",
        variant: "danger",
      });
    } else {
      pushNotification({
        title: getAxiosErrorMessage(error),
        variant: "danger",
      });
    }
  };

  const { mutate: deleteTag } = useDeleteTagMutation(
    onDeleteTagSuccess,
    onDeleteTagError
  );

  const onDeleteTagTypeSuccess = (response: any) => {
    pushNotification({
      title: t("terms.tagTypeDeleted"),
      variant: "success",
    });
    refetch();
  };

  const onDeleteTagTypeError = (error: AxiosError) => {
    if (
      error.response?.status === 500 &&
      error.response?.data.error === "FOREIGN KEY constraint failed"
    ) {
      pushNotification({
        title: "Cannot delete a used tag",
        variant: "danger",
      });
    } else {
      pushNotification({
        title: getAxiosErrorMessage(error),
        variant: "danger",
      });
    }
  };

  const { mutate: deleteTagType } = useDeleteTagTypeMutation(
    onDeleteTagTypeSuccess,
    onDeleteTagTypeError
  );

  const { tagTypes, isFetching, fetchError, refetch } = useFetchTagTypes();

  const {
    isItemSelected: isItemExpanded,
    toggleItemSelected: toggleItemExpanded,
  } = useSelectionState<TagType>({
    items: tagTypes || [],
    isEqual: (a, b) => a.id === b.id,
  });

  const filterCategories: FilterCategory<TagType>[] = [
    {
      key: "tags",
      title: t("terms.name"),
      type: FilterType.multiselect,
      placeholderText:
        t("actions.filterBy", {
          what: t("terms.name").toLowerCase(),
        }) + "...",
      getItemValue: (item: TagType) => {
        let tagTypeNames = item.name?.toString() || "";
        let tagNames = item?.tags
          ?.map((tag) => tag.name)
          .concat(tagTypeNames)
          .join("");

        return tagNames || "";
      },
      selectOptions: dedupeFunction(
        tagTypes
          ?.map((tagType) => tagType?.tags)
          .flat()
          .filter((tag) => tag && tag.name)
          .map((tag) => ({ key: tag?.name, value: tag?.name }))
          .concat(
            tagTypes?.map((tagType) => ({
              key: tagType?.name,
              value: tagType?.name,
            }))
          )
          .sort((a, b) => {
            if (a.value && b.value) {
              return a?.value.localeCompare(b?.value);
            } else {
              return 0;
            }
          })
      ),
    },
    {
      key: "rank",
      title: t("terms.rank"),
      type: FilterType.search,
      placeholderText:
        t("actions.filterBy", {
          what: t("terms.rank").toLowerCase(),
        }) + "...",
      getItemValue: (item) => {
        return item.rank?.toString() || "";
      },
    },
    {
      key: "color",
      title: t("terms.color"),
      type: FilterType.search,
      placeholderText:
        t("actions.filterBy", {
          what: t("terms.color").toLowerCase(),
        }) + "...",
      getItemValue: (item) => {
        const colorLabel = DEFAULT_COLOR_LABELS.get(item?.colour || "");
        return colorLabel || "";
      },
    },
  ];
  const { filterValues, setFilterValues, filteredItems } = useFilterState(
    tagTypes || [],
    filterCategories
  );

  const getSortValues = (item: TagType) => [
    "",
    item?.name || "",
    item?.rank || "",
    "",
    item?.tags?.length || 0,
    "", // Action column
  ];

  const { sortBy, onSort, sortedItems } = useSortState(
    filteredItems,
    getSortValues
  );

  const { currentPageItems, setPageNumber, paginationProps } =
    usePaginationState(sortedItems, 10);

  const deleteTagFromTable = (row: Tag) => {
    setTagIdToDelete(row.id);
    setIsTagToDeleteConfirmDialogOpen(true);
  };

  const columns: ICell[] = [
    {
      title: t("terms.tagType"),
      transforms: [sortable],
      cellFormatters: [expandable],
    },
    { title: t("terms.rank"), transforms: [sortable] },
    {
      title: t("terms.color"),
      transforms: [],
    },
    {
      title: t("terms.tagCount"),
      transforms: [sortable],
    },
    {
      title: "",
      props: {
        className: "pf-u-text-align-right",
      },
    },
  ];

  const rows: IRow[] = [];
  currentPageItems.forEach((item) => {
    const isExpanded = isItemExpanded(item) && !!item?.tags?.length;
    rows.push({
      [ENTITY_FIELD]: item,
      isOpen: (item.tags || []).length > 0 ? isExpanded : undefined,
      cells: [
        {
          title: item.name,
        },
        {
          title: item.rank,
        },
        {
          title: <>{item.colour && <Color hex={item.colour} />}</>,
        },
        {
          title: item.tags ? item.tags.length : 0,
        },
        {
          title: (
            <AppTableActionButtons
              isDeleteEnabled={!!item.tags?.length}
              tooltipMessage="Cannot delete non empty tag type"
              onEdit={() => setRowToUpdate(item)}
              onDelete={() => deleteRow(item)}
            />
          ),
        },
      ],
    });

    if (isExpanded) {
      rows.push({
        parent: rows.length - 1,
        fullWidth: true,
        noPadding: true,
        cells: [
          {
            title: (
              <div>
                <TagTable
                  tagType={item}
                  onEdit={setTagToUpdate}
                  onDelete={deleteTagFromTable}
                />
              </div>
            ),
          },
        ],
      });
    }
  });

  // Rows

  const collapseRow = (
    event: React.MouseEvent,
    rowIndex: number,
    isOpen: boolean,
    rowData: IRowData,
    extraData: IExtraData
  ) => {
    const row = getRow(rowData);
    toggleItemExpanded(row);
  };

  const deleteRow = (row: TagType) => {
    setTagTypeIdToDelete(row.id);
    setIsTagTypeToDeleteConfirmDialogOpen(true);
  };

  // Advanced filters

  const handleOnClearAllFilters = () => {
    setFilterValues({});
  };

  // Create Modal

  const handleOnOpenCreateNewTagTypeModal = () => {
    setIsNewTagTypeModalOpen(true);
  };

  const handleOnOpenCreateNewTagModal = () => {
    setIsNewTagModalOpen(true);
  };

  const handleOnCreatedNewTagType = (response: AxiosResponse<TagType>) => {
    setIsNewTagTypeModalOpen(false);
    refetch();
    pushNotification({
      title: t("toastr.success.added", {
        what: response.data.name,
        type: "tag type",
      }),
      variant: "success",
    });
  };

  const handleOnCreatedNewTag = (response: AxiosResponse<Tag>) => {
    setIsNewTagModalOpen(false);
    refetch();
    pushNotification({
      title: t("toastr.success.added", {
        what: response.data.name,
        type: "tag",
      }),
      variant: "success",
    });
  };

  const handleOnCreateNewCancel = () => {
    setIsNewTagTypeModalOpen(false);
    setIsNewTagModalOpen(false);
  };

  // Update Modal

  const handleOnTagTypeUpdated = () => {
    setRowToUpdate(undefined);
    refetch();
  };

  const handleOnTagUpdated = () => {
    setTagToUpdate(undefined);
    refetch();
  };

  const handleOnUpdatedCancel = () => {
    setRowToUpdate(undefined);
    setTagToUpdate(undefined);
  };
  return (
    <>
      <ConditionalRender
        when={isFetching && !(tagTypes || fetchError)}
        then={<AppPlaceholder />}
      >
        <AppTableWithControls
          paginationProps={paginationProps}
          paginationIdPrefix="tags"
          count={tagTypes ? tagTypes.length : 0}
          sortBy={sortBy}
          onSort={onSort}
          onCollapse={collapseRow}
          cells={columns}
          rows={rows}
          isLoading={isFetching}
          loadingVariant="skeleton"
          fetchError={fetchError}
          toolbarClearAllFilters={handleOnClearAllFilters}
          toolbarToggle={
            <FilterToolbar<TagType>
              filterCategories={filterCategories}
              filterValues={filterValues}
              setFilterValues={setFilterValues}
            />
          }
          toolbarActions={
            <ToolbarGroup variant="button-group">
              <RBAC
                allowedPermissions={controlsWriteScopes}
                rbacType={RBAC_TYPE.Scope}
              >
                <ToolbarItem>
                  <Button
                    type="button"
                    id="create-tag"
                    aria-label="Create tag"
                    variant={ButtonVariant.primary}
                    onClick={handleOnOpenCreateNewTagModal}
                  >
                    {t("actions.createTag")}
                  </Button>
                </ToolbarItem>
                <ToolbarItem>
                  <Button
                    type="button"
                    id="create-tag-type"
                    aria-label="Create tag type"
                    variant={ButtonVariant.secondary}
                    onClick={handleOnOpenCreateNewTagTypeModal}
                  >
                    {t("actions.createTagType")}
                  </Button>
                </ToolbarItem>
              </RBAC>
            </ToolbarGroup>
          }
          noDataState={
            <NoDataEmptyState
              // t('terms.tagTypes')
              title={t("composed.noDataStateTitle", {
                what: t("terms.tagTypes").toLowerCase(),
              })}
              // t('terms.stakeholderGroup')
              description={
                t("composed.noDataStateBody", {
                  what: t("terms.tagType").toLowerCase(),
                }) + "."
              }
            />
          }
        />
      </ConditionalRender>

      <NewTagTypeModal
        isOpen={isNewTagTypeModalOpen}
        onSaved={handleOnCreatedNewTagType}
        onCancel={handleOnCreateNewCancel}
      />
      <UpdateTagTypeModal
        tagType={rowToUpdate}
        onSaved={handleOnTagTypeUpdated}
        onCancel={handleOnUpdatedCancel}
      />

      <NewTagModal
        isOpen={isNewTagModalOpen}
        onSaved={handleOnCreatedNewTag}
        onCancel={handleOnCreateNewCancel}
      />
      <UpdateTagModal
        tag={tagToUpdate}
        onSaved={handleOnTagUpdated}
        onCancel={handleOnUpdatedCancel}
      />
      {isTagToDeleteConfirmDialogOpen && (
        <ConfirmDialog
          title={t("dialog.title.delete", {
            what: t("terms.tag").toLowerCase(),
          })}
          titleIconVariant={"warning"}
          message={t("dialog.message.delete")}
          isOpen={true}
          confirmBtnVariant={ButtonVariant.danger}
          confirmBtnLabel={t("actions.delete")}
          cancelBtnLabel={t("actions.cancel")}
          onCancel={() => setIsTagToDeleteConfirmDialogOpen(false)}
          onClose={() => setIsTagToDeleteConfirmDialogOpen(false)}
          onConfirm={() => {
            if (tagIdToDelete) {
              deleteTag(tagIdToDelete);
              setTagIdToDelete(undefined);
            }
            setIsTagToDeleteConfirmDialogOpen(false);
          }}
        />
      )}
      {isTagTypeToDeleteConfirmDialogOpen && (
        <ConfirmDialog
          title={t("dialog.title.delete", {
            what: t("terms.tagType").toLowerCase(),
          })}
          titleIconVariant={"warning"}
          message={t("dialog.message.delete")}
          isOpen={true}
          confirmBtnVariant={ButtonVariant.danger}
          confirmBtnLabel={t("actions.delete")}
          cancelBtnLabel={t("actions.cancel")}
          onCancel={() => setIsTagTypeToDeleteConfirmDialogOpen(false)}
          onClose={() => setIsTagTypeToDeleteConfirmDialogOpen(false)}
          onConfirm={() => {
            if (tagTypeIdToDelete) {
              deleteTagType(tagTypeIdToDelete);
              setTagTypeIdToDelete(undefined);
            }
            setIsTagTypeToDeleteConfirmDialogOpen(false);
          }}
        />
      )}
    </>
  );
};
