import React, { useCallback, useEffect, useState } from "react";
import { AxiosResponse } from "axios";
import { useTranslation } from "react-i18next";
import { useSelectionState } from "@konveyor/lib-ui";

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

import { useDispatch } from "react-redux";
import { alertActions } from "@app/store/alert";
import { confirmDialogActions } from "@app/store/confirmDialog";

import {
  AppPlaceholder,
  AppTableActionButtons,
  AppTableWithControls,
  ConditionalRender,
  NoDataEmptyState,
  Color,
} from "@app/shared/components";
import { useFetchTagTypes, useDelete } from "@app/shared/hooks";

import { dedupeFunction, getAxiosErrorMessage } from "@app/utils/utils";
import { deleteTag, deleteTagType } from "@app/api/rest";
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
import { RBAC, RBAC_TYPE, writeScopes } from "@app/rbac";

const ENTITY_FIELD = "entity";

const getRow = (rowData: IRowData): TagType => {
  return rowData[ENTITY_FIELD];
};

export const Tags: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const [isNewTagTypeModalOpen, setIsNewTagTypeModalOpen] = useState(false);
  const [rowToUpdate, setRowToUpdate] = useState<TagType>();

  const [isNewTagModalOpen, setIsNewTagModalOpen] = useState(false);
  const [tagToUpdate, setTagToUpdate] = useState<Tag>();

  const { requestDelete: requestDeleteTagType } = useDelete<TagType>({
    onDelete: (t: TagType) => deleteTagType(t.id!),
  });
  const { requestDelete: requestDeleteTag } = useDelete<Tag>({
    onDelete: (t: Tag) => deleteTag(t.id!),
  });

  const { tagTypes, isFetching, fetchError, fetchTagTypes } =
    useFetchTagTypes(true);

  const {
    isItemSelected: isItemExpanded,
    toggleItemSelected: toggleItemExpanded,
  } = useSelectionState<TagType>({
    items: tagTypes || [],
    isEqual: (a, b) => a.id === b.id,
  });

  const refreshTable = useCallback(() => {
    fetchTagTypes();
  }, [fetchTagTypes]);

  useEffect(() => {
    fetchTagTypes();
  }, [fetchTagTypes]);

  const filterCategories: FilterCategory<TagType>[] = [
    {
      key: "tags",
      title: "Name",
      type: FilterType.multiselect,
      placeholderText: "Filter by name...",
      getItemValue: (item: TagType) => {
        let tagNames = item?.tags?.map((tag) => tag.name).join("");
        return tagNames || "";
      },
      selectOptions: dedupeFunction(
        tagTypes
          ?.map((tagType) => tagType?.tags)
          .flat()
          .map((tag) => ({ key: tag?.name, value: tag?.name }))
      ),
    },
    {
      key: "rank",
      title: "Rank",
      type: FilterType.search,
      placeholderText: "Filter by rank...",
      getItemValue: (item) => {
        return item.rank?.toString() || "";
      },
    },
    {
      key: "color",
      title: "Color",
      type: FilterType.search,
      placeholderText: "Filter by color...",
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

  //

  const deleteTagFromTable = (row: Tag) => {
    dispatch(
      confirmDialogActions.openDialog({
        // t("terms.tag")
        title: t("dialog.title.delete", { what: t("terms.tag").toLowerCase() }),
        titleIconVariant: "warning",
        message: t("dialog.message.delete"),
        confirmBtnVariant: ButtonVariant.danger,
        confirmBtnLabel: t("actions.delete"),
        cancelBtnLabel: t("actions.cancel"),
        onConfirm: () => {
          dispatch(confirmDialogActions.processing());
          requestDeleteTag(
            row,
            () => {
              dispatch(confirmDialogActions.closeDialog());
              refreshTable();
            },
            (error) => {
              dispatch(confirmDialogActions.closeDialog());
              if (
                error.response?.status === 500 &&
                error.response?.data.error === "FOREIGN KEY constraint failed"
              )
                dispatch(alertActions.addDanger("Cannot delete a used tag"));
              else
                dispatch(alertActions.addDanger(getAxiosErrorMessage(error)));
            }
          );
        },
      })
    );
  };

  //

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
    dispatch(
      confirmDialogActions.openDialog({
        // t("terms.tagType")
        title: t("dialog.title.delete", {
          what: t("terms.tagType").toLowerCase(),
        }),
        titleIconVariant: "warning",
        message: t("dialog.message.delete"),
        confirmBtnVariant: ButtonVariant.danger,
        confirmBtnLabel: t("actions.delete"),
        cancelBtnLabel: t("actions.cancel"),
        onConfirm: () => {
          dispatch(confirmDialogActions.processing());
          requestDeleteTagType(
            row,
            () => {
              dispatch(confirmDialogActions.closeDialog());
              refreshTable();
            },
            (error) => {
              dispatch(confirmDialogActions.closeDialog());
              if (
                error.response?.status === 500 &&
                error.response?.data.error === "FOREIGN KEY constraint failed"
              )
                dispatch(
                  alertActions.addDanger("Cannot delete a non empty tag type")
                );
              else
                dispatch(alertActions.addDanger(getAxiosErrorMessage(error)));
            }
          );
        },
      })
    );
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
    refreshTable();

    dispatch(
      alertActions.addSuccess(
        t("toastr.success.added", {
          what: response.data.name,
          type: "tag type",
        })
      )
    );
  };

  const handleOnCreatedNewTag = (response: AxiosResponse<Tag>) => {
    setIsNewTagModalOpen(false);
    refreshTable();

    dispatch(
      alertActions.addSuccess(
        t("toastr.success.added", {
          what: response.data.name,
          type: "tag",
        })
      )
    );
  };

  const handleOnCreateNewCancel = () => {
    setIsNewTagTypeModalOpen(false);
    setIsNewTagModalOpen(false);
  };

  // Update Modal

  const handleOnTagTypeUpdated = () => {
    setRowToUpdate(undefined);
    refreshTable();
  };

  const handleOnTagUpdated = () => {
    setTagToUpdate(undefined);
    refreshTable();
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
              <RBAC allowedPermissions={writeScopes} rbacType={RBAC_TYPE.Scope}>
                <ToolbarItem>
                  <Button
                    type="button"
                    aria-label="create-tag"
                    variant={ButtonVariant.primary}
                    onClick={handleOnOpenCreateNewTagModal}
                  >
                    {t("actions.createTag")}
                  </Button>
                </ToolbarItem>
                <ToolbarItem>
                  <Button
                    type="button"
                    aria-label="create-tag-type"
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
    </>
  );
};
