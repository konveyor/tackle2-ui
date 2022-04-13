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

import { getAxiosErrorMessage } from "@app/utils/utils";
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
      key: "name",
      title: "Name",
      type: FilterType.search,
      placeholderText: "Filter by name...",
      getItemValue: (item) => {
        return item?.name || "";
      },
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
        return item?.colour || "";
      },
    },
  ];
  const { filterValues, setFilterValues, filteredItems } = useFilterState(
    tagTypes || [],
    filterCategories
  );
  const getSortValues = (item: TagType) => [
    item?.name || "",
    item?.rank || "",
    item?.colour || "",
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
    const isExpanded = isItemExpanded(item);
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
