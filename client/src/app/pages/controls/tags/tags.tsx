import React, { useState } from "react";
import { AxiosError, AxiosResponse } from "axios";
import { useTranslation } from "react-i18next";
import { useSelectionState } from "@migtools/lib-ui";

import {
  Button,
  ButtonVariant,
  Modal,
  ModalVariant,
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
import { Tag, TagCategory } from "@app/api/models";
import { TagTable } from "./components/tag-table";
import { useLegacyPaginationState } from "@app/shared/hooks/useLegacyPaginationState";
import {
  FilterCategory,
  FilterToolbar,
  FilterType,
} from "@app/shared/components/FilterToolbar";
import { useLegacyFilterState } from "@app/shared/hooks/useLegacyFilterState";
import { useLegacySortState } from "@app/shared/hooks/useLegacySortState";
import { controlsWriteScopes, RBAC, RBAC_TYPE } from "@app/rbac";
import {
  useDeleteTagMutation,
  useDeleteTagCategoryMutation,
  useFetchTagCategories,
} from "@app/queries/tags";
import { NotificationsContext } from "@app/shared/notifications-context";
import { COLOR_NAMES_BY_HEX_VALUE } from "@app/Constants";
import { TagForm } from "./components/tag-form";
import { TagCategoryForm } from "./components/tag-category-form";
import { getTagCategoryFallbackColor } from "@app/pages/applications/components/application-tags/application-tag-label";

const ENTITY_FIELD = "entity";

const getRow = (rowData: IRowData): TagCategory => {
  return rowData[ENTITY_FIELD];
};

export const Tags: React.FC = () => {
  const { t } = useTranslation();
  const { pushNotification } = React.useContext(NotificationsContext);

  const [isTagToDeleteConfirmDialogOpen, setIsTagToDeleteConfirmDialogOpen] =
    React.useState<Boolean>(false);

  const [
    isTagCategoryToDeleteConfirmDialogOpen,
    setIsTagCategoryToDeleteConfirmDialogOpen,
  ] = React.useState<Boolean>(false);

  const [tagIdToDelete, setTagIdToDelete] = React.useState<number>();
  const [tagCategoryIdToDelete, setTagCategoryIdToDelete] =
    React.useState<number>();

  const [tagCategoryModalState, setTagCategoryModalState] = React.useState<
    "create" | TagCategory | null
  >(null);
  const isTagCategoryModalOpen = tagCategoryModalState !== null;
  const tagCategoryToUpdate =
    tagCategoryModalState !== "create" ? tagCategoryModalState : null;

  // const [isNewTagCategoryModalOpen, setIsNewTagCategoryModalOpen] =
  //   useState(false);
  // const [rowToUpdate, setRowToUpdate] = useState<TagCategory>();

  const [tagModalState, setTagModalState] = React.useState<
    "create" | Tag | null
  >(null);
  const isTagModalOpen = tagModalState !== null;
  const tagToUpdate = tagModalState !== "create" ? tagModalState : null;

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

  const onDeleteTagCategorySuccess = (response: any) => {
    pushNotification({
      title: t("terms.tagCategoryDeleted"),
      variant: "success",
    });
    refetch();
  };

  const onDeleteTagCategoryError = (error: AxiosError) => {
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

  const { mutate: deleteTagCategory } = useDeleteTagCategoryMutation(
    onDeleteTagCategorySuccess,
    onDeleteTagCategoryError
  );

  const closeTagCategoryModal = () => {
    setTagCategoryModalState(null);
    refetch;
  };

  const closeTagModal = () => {
    setTagModalState(null);
    refetch;
  };

  const {
    tagCategories: tagCategories,
    isFetching,
    fetchError,
    refetch,
  } = useFetchTagCategories();

  const {
    isItemSelected: isItemExpanded,
    toggleItemSelected: toggleItemExpanded,
  } = useSelectionState<TagCategory>({
    items: tagCategories || [],
    isEqual: (a, b) => a.id === b.id,
  });

  const filterCategories: FilterCategory<
    TagCategory,
    "tags" | "rank" | "color"
  >[] = [
    {
      key: "tags",
      title: t("terms.name"),
      type: FilterType.multiselect,
      placeholderText:
        t("actions.filterBy", {
          what: t("terms.name").toLowerCase(),
        }) + "...",
      getItemValue: (item: TagCategory) => {
        let tagCategoryNames = item.name?.toString() || "";
        let tagNames = item?.tags
          ?.map((tag) => tag.name)
          .concat(tagCategoryNames)
          .join("");

        return tagNames || "";
      },
      selectOptions: dedupeFunction(
        tagCategories
          ?.map((tagCategory) => tagCategory?.tags)
          .flat()
          .filter((tag) => tag && tag.name)
          .map((tag) => ({ key: tag?.name, value: tag?.name }))
          .concat(
            tagCategories?.map((tagCategory) => ({
              key: tagCategory?.name,
              value: tagCategory?.name,
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
        const hex = item?.colour || "";
        const colorLabel = COLOR_NAMES_BY_HEX_VALUE[hex];
        return colorLabel || hex;
      },
    },
  ];
  const { filterValues, setFilterValues, filteredItems } = useLegacyFilterState(
    tagCategories || [],
    filterCategories
  );

  const getSortValues = (item: TagCategory) => [
    "",
    item?.name || "",
    item?.rank || "",
    "",
    item?.tags?.length || 0,
    "", // Action column
  ];

  const { sortBy, onSort, sortedItems } = useLegacySortState(
    filteredItems,
    getSortValues
  );

  const { currentPageItems, setPageNumber, paginationProps } =
    useLegacyPaginationState(sortedItems, 10);

  const deleteTagFromTable = (row: Tag) => {
    setTagIdToDelete(row.id);
    setIsTagToDeleteConfirmDialogOpen(true);
  };

  const columns: ICell[] = [
    {
      title: t("terms.tagCategory"),
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
    const categoryColor = item.colour || getTagCategoryFallbackColor(item);
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
          title: <Color hex={categoryColor} />,
        },
        {
          title: item.tags ? item.tags.length : 0,
        },
        {
          title: (
            <AppTableActionButtons
              isDeleteEnabled={!!item.tags?.length}
              tooltipMessage="Cannot delete non empty tag category"
              onEdit={() => setTagCategoryModalState(item)}
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
                  tagCategory={item}
                  onEdit={setTagModalState}
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

  const deleteRow = (row: TagCategory) => {
    setTagCategoryIdToDelete(row.id);
    setIsTagCategoryToDeleteConfirmDialogOpen(true);
  };

  // Advanced filters

  const handleOnClearAllFilters = () => {
    setFilterValues({});
  };

  return (
    <>
      <ConditionalRender
        when={isFetching && !(tagCategories || fetchError)}
        then={<AppPlaceholder />}
      >
        <AppTableWithControls
          paginationProps={paginationProps}
          paginationIdPrefix="tags"
          count={tagCategories ? tagCategories.length : 0}
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
            <FilterToolbar
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
                    onClick={() => setTagModalState("create")}
                  >
                    {t("actions.createTag")}
                  </Button>
                </ToolbarItem>
                <ToolbarItem>
                  <Button
                    type="button"
                    id="create-tag-category"
                    aria-label="Create tag category"
                    variant={ButtonVariant.secondary}
                    onClick={() => setTagCategoryModalState("create")}
                  >
                    {t("actions.createTagCategory")}
                  </Button>
                </ToolbarItem>
              </RBAC>
            </ToolbarGroup>
          }
          noDataState={
            <NoDataEmptyState
              // t('terms.tagCategories')
              title={t("composed.noDataStateTitle", {
                what: t("terms.tagCategories").toLowerCase(),
              })}
              // t('terms.stakeholderGroup')
              description={
                t("composed.noDataStateBody", {
                  what: t("terms.tagCategory").toLowerCase(),
                }) + "."
              }
            />
          }
        />
      </ConditionalRender>

      <Modal
        id="create-edit-tag-category-modal"
        title={
          tagCategoryToUpdate
            ? t("dialog.title.update", {
                what: t("terms.tagCategory").toLowerCase(),
              })
            : t("dialog.title.new", {
                what: t("terms.tagCategory").toLowerCase(),
              })
        }
        variant={ModalVariant.medium}
        isOpen={isTagCategoryModalOpen}
        onClose={closeTagCategoryModal}
      >
        <TagCategoryForm
          tagCategory={tagCategoryToUpdate ? tagCategoryToUpdate : undefined}
          onClose={closeTagCategoryModal}
        />
      </Modal>

      <Modal
        id="create-edit-tag-modal"
        title={
          tagToUpdate
            ? t("dialog.title.update", {
                what: t("terms.tag").toLowerCase(),
              })
            : t("dialog.title.new", {
                what: t("terms.tag").toLowerCase(),
              })
        }
        variant={ModalVariant.medium}
        isOpen={isTagModalOpen}
        onClose={closeTagModal}
      >
        <TagForm
          tag={tagToUpdate ? tagToUpdate : undefined}
          onClose={closeTagModal}
        />
      </Modal>

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
      {isTagCategoryToDeleteConfirmDialogOpen && (
        <ConfirmDialog
          title={t("dialog.title.delete", {
            what: t("terms.tagCategory").toLowerCase(),
          })}
          titleIconVariant={"warning"}
          message={t("dialog.message.delete")}
          isOpen={true}
          confirmBtnVariant={ButtonVariant.danger}
          confirmBtnLabel={t("actions.delete")}
          cancelBtnLabel={t("actions.cancel")}
          onCancel={() => setIsTagCategoryToDeleteConfirmDialogOpen(false)}
          onClose={() => setIsTagCategoryToDeleteConfirmDialogOpen(false)}
          onConfirm={() => {
            if (tagCategoryIdToDelete) {
              deleteTagCategory(tagCategoryIdToDelete);
              setTagCategoryIdToDelete(undefined);
            }
            setIsTagCategoryToDeleteConfirmDialogOpen(false);
          }}
        />
      )}
    </>
  );
};
