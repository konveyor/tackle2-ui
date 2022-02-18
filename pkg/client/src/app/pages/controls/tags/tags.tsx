import React, { useCallback, useEffect, useState } from "react";
import { AxiosResponse } from "axios";
import { useTranslation } from "react-i18next";
import { useSelectionState } from "@konveyor/lib-ui";

import {
  Button,
  ButtonVariant,
  ToolbarChip,
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
  AppTableToolbarToggleGroup,
  NoDataEmptyState,
  SearchFilter,
  Color,
} from "@app/shared/components";
import {
  useTableControls,
  useFetchTagTypes,
  useDelete,
} from "@app/shared/hooks";

import { getAxiosErrorMessage } from "@app/utils/utils";
import {
  deleteTag,
  deleteTagType,
  TagTypeSortBy,
  TagTypeSortByQuery,
} from "@app/api/rest";
import { SortByQuery, Tag, TagType } from "@app/api/models";

import { NewTagTypeModal } from "./components/new-tag-type-modal";
import { UpdateTagTypeModal } from "./components/update-tag-type-modal";
import { NewTagModal } from "./components/new-tag-modal";
import { UpdateTagModal } from "./components/update-tag-modal";
import { TagTable } from "./components/tag-table";

enum FilterKey {
  TAG_TYPE = "tagType",
  TAG = "tags",
}

const toSortByQuery = (
  sortBy?: SortByQuery
): TagTypeSortByQuery | undefined => {
  if (!sortBy) {
    return undefined;
  }

  let field: TagTypeSortBy;
  switch (sortBy.index) {
    case 1:
      field = TagTypeSortBy.NAME;
      break;
    case 2:
      field = TagTypeSortBy.RANK;
      break;
    case 3:
      field = TagTypeSortBy.COLOR;
      break;
    case 4:
      field = TagTypeSortBy.TAGS_COUNT;
      break;
    default:
      throw new Error("Invalid column index=" + sortBy.index);
  }

  return {
    field,
    direction: sortBy.direction,
  };
};

const ENTITY_FIELD = "entity";

const getRow = (rowData: IRowData): TagType => {
  return rowData[ENTITY_FIELD];
};

export const Tags: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const filters = [
    {
      key: FilterKey.TAG_TYPE,
      name: t("terms.tagType"),
    },
    {
      key: FilterKey.TAG,
      name: t("terms.tagName"),
    },
  ];
  const [filtersValue, setFiltersValue] = useState<Map<FilterKey, string[]>>(
    new Map([])
  );

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
    paginationQuery,
    sortByQuery,
    handlePaginationChange,
    handleSortChange,
  } = useTableControls({
    sortByQuery: { direction: "asc", index: 1 },
  });

  const {
    isItemSelected: isItemExpanded,
    toggleItemSelected: toggleItemExpanded,
  } = useSelectionState<TagType>({
    items: tagTypes?.data || [],
    isEqual: (a, b) => a.id === b.id,
  });

  const refreshTable = useCallback(() => {
    fetchTagTypes(
      {
        tagTypes: filtersValue.get(FilterKey.TAG_TYPE),
        tags: filtersValue.get(FilterKey.TAG),
      },
      paginationQuery,
      toSortByQuery(sortByQuery)
    );
  }, [filtersValue, paginationQuery, sortByQuery, fetchTagTypes]);

  useEffect(() => {
    fetchTagTypes(
      {
        tagTypes: filtersValue.get(FilterKey.TAG_TYPE),
        tags: filtersValue.get(FilterKey.TAG),
      },
      paginationQuery,
      toSortByQuery(sortByQuery)
    );
  }, [filtersValue, paginationQuery, sortByQuery, fetchTagTypes]);

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
  tagTypes?.data.forEach((item) => {
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
              if (tagTypes?.data.length === 1) {
                handlePaginationChange({ page: paginationQuery.page - 1 });
              } else {
                refreshTable();
              }
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
    setFiltersValue((current) => {
      const newVal = new Map(current);
      Array.from(newVal.keys()).forEach((key) => {
        newVal.set(key, []);
      });
      return newVal;
    });
  };

  const handleOnAddFilter = (key: string, filterText: string) => {
    const filterKey: FilterKey = key as FilterKey;
    setFiltersValue((current) => {
      const values: string[] = current.get(filterKey) || [];
      return new Map(current).set(filterKey, [...values, filterText]);
    });

    handlePaginationChange({ page: 1 });
  };

  const handleOnDeleteFilter = (
    key: string,
    value: (string | ToolbarChip)[]
  ) => {
    const filterKey: FilterKey = key as FilterKey;
    setFiltersValue((current) =>
      new Map(current).set(filterKey, value as string[])
    );
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
          count={tagTypes ? tagTypes.meta.count : 0}
          pagination={paginationQuery}
          sortBy={sortByQuery}
          onPaginationChange={handlePaginationChange}
          onSort={handleSortChange}
          onCollapse={collapseRow}
          cells={columns}
          rows={rows}
          // actions={actions}
          isLoading={isFetching}
          loadingVariant="skeleton"
          fetchError={fetchError}
          toolbarClearAllFilters={handleOnClearAllFilters}
          filtersApplied={
            Array.from(filtersValue.values()).reduce(
              (previous, current) => [...previous, ...current],
              []
            ).length > 0
          }
          toolbarToggle={
            <AppTableToolbarToggleGroup
              categories={filters}
              chips={filtersValue}
              onChange={handleOnDeleteFilter}
            >
              <SearchFilter
                options={filters}
                onApplyFilter={handleOnAddFilter}
              />
            </AppTableToolbarToggleGroup>
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
