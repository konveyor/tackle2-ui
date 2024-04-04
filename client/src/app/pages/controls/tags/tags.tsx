import React from "react";
import { AxiosError } from "axios";
import { useTranslation } from "react-i18next";
import {
  Button,
  ButtonVariant,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  Modal,
  ModalVariant,
  Title,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
} from "@patternfly/react-core";
import {
  ExpandableRowContent,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@patternfly/react-table";
import { CubesIcon } from "@patternfly/react-icons";

import {
  dedupeFunction,
  getAxiosErrorMessage,
  localeNumericCompare,
} from "@app/utils/utils";
import { Tag, TagCategory } from "@app/api/models";
import { FilterToolbar, FilterType } from "@app/components/FilterToolbar";
import {
  useDeleteTagMutation,
  useDeleteTagCategoryMutation,
  useFetchTagCategories,
} from "@app/queries/tags";
import { NotificationsContext } from "@app/components/NotificationsContext";
import { COLOR_NAMES_BY_HEX_VALUE } from "@app/Constants";
import { TagForm } from "./components/tag-form";
import { TagCategoryForm } from "./components/tag-category-form";
import { getTagCategoryFallbackColor } from "@app/components/labels/item-tag-label/item-tag-label";
import { AppTableActionButtons } from "@app/components/AppTableActionButtons";
import { Color } from "@app/components/Color";
import { ConditionalRender } from "@app/components/ConditionalRender";
import { AppPlaceholder } from "@app/components/AppPlaceholder";
import { ConfirmDialog } from "@app/components/ConfirmDialog";
import { SimplePagination } from "@app/components/SimplePagination";
import {
  TableHeaderContentWithControls,
  ConditionalTableBody,
  TableRowContentWithControls,
} from "@app/components/TableControls";
import { useLocalTableControls } from "@app/hooks/table-controls";
import { RBAC, controlsWriteScopes, RBAC_TYPE } from "@app/rbac";
import { TagTable } from "./components/tag-table";
import i18n from "@app/i18n";

export const Tags: React.FC = () => {
  const { t } = useTranslation();
  const { pushNotification } = React.useContext(NotificationsContext);

  const [tagToDelete, setTagToDelete] = React.useState<Tag>();
  const [tagCategoryToDelete, setTagCategoryToDelete] =
    React.useState<TagCategory>();

  const [tagCategoryModalState, setTagCategoryModalState] = React.useState<
    "create" | TagCategory | null
  >(null);
  const isTagCategoryModalOpen = tagCategoryModalState !== null;
  const tagCategoryToUpdate =
    tagCategoryModalState !== "create" ? tagCategoryModalState : null;

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

  const deleteTagFromTable = (tag: Tag) => {
    setTagToDelete(tag);
  };

  const tableControls = useLocalTableControls({
    tableName: "business-services-table",
    idProperty: "name",
    items: tagCategories,
    columnNames: {
      name: t("terms.name"),
      rank: t("terms.rank"),
      color: t("terms.color"),
      tagCount: t("terms.tagCount"),
    },
    isFilterEnabled: true,
    isSortEnabled: true,
    isPaginationEnabled: true,
    hasActionsColumn: true,
    isExpansionEnabled: true,
    expandableVariant: "single",
    filterCategories: [
      {
        categoryKey: "tags",
        title: t("terms.name"),
        type: FilterType.multiselect,
        placeholderText: t("actions.filterBy", {
          what: t("terms.name").toLowerCase(),
        }),
        getItemValue: (item) => {
          const tagCategoryNames = item.name?.toString() || "";
          const tagNames = item?.tags
            ?.map((tag) => tag.name)
            .concat(tagCategoryNames)
            .join("");
          return tagNames || "";
        },
        selectOptions: dedupeFunction(
          tagCategories
            ?.flatMap((tagCategory) => tagCategory?.tags ?? [])
            .filter((tag) => tag && tag.name)
            .map((tag) => ({ key: tag.name, value: tag.name }))
            .concat(
              tagCategories?.map((tagCategory) => ({
                key: tagCategory?.name,
                value: tagCategory?.name,
              })) ?? []
            )
            .sort((a, b) =>
              localeNumericCompare(a.value, b.value, i18n.language)
            )
        ),
      },
      {
        categoryKey: "rank",
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
        categoryKey: "color",
        title: t("terms.color"),
        type: FilterType.search,
        placeholderText:
          t("actions.filterBy", {
            what: t("terms.color").toLowerCase(),
          }) + "...",
        getItemValue: (item) => {
          const hex = item?.colour || "";
          const colorLabel = COLOR_NAMES_BY_HEX_VALUE[hex.toLowerCase()];
          return colorLabel || hex;
        },
      },
    ],
    initialItemsPerPage: 10,
    sortableColumns: ["name", "rank", "tagCount"],
    initialSort: { columnKey: "name", direction: "asc" },
    getSortValues: (item) => ({
      name: item?.name || "",
      rank: typeof item?.rank === "number" ? item.rank : Number.MAX_VALUE,
      tagCount: item?.tags?.length || 0,
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
    expansionDerivedState: { isCellExpanded },
  } = tableControls;

  return (
    <>
      <ConditionalRender
        when={isFetching && !(tagCategories || fetchError)}
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
              <ToolbarItem {...paginationToolbarItemProps}>
                <SimplePagination
                  idPrefix="tag-category-table"
                  isTop
                  paginationProps={paginationProps}
                />
              </ToolbarItem>
            </ToolbarContent>
          </Toolbar>
          <Table {...tableProps} aria-label="Tag category table">
            <Thead>
              <Tr>
                <TableHeaderContentWithControls {...tableControls}>
                  <Th {...getThProps({ columnKey: "name" })} />
                  <Th {...getThProps({ columnKey: "rank" })} />
                  <Th {...getThProps({ columnKey: "color" })} />
                  <Th {...getThProps({ columnKey: "tagCount" })} />
                </TableHeaderContentWithControls>
              </Tr>
            </Thead>
            <ConditionalTableBody
              isLoading={isFetching}
              isError={!!fetchError}
              isNoData={currentPageItems.length === 0}
              noDataEmptyState={
                <EmptyState variant="sm">
                  <EmptyStateIcon icon={CubesIcon} />
                  <Title headingLevel="h2" size="lg">
                    {t("composed.noDataStateTitle", {
                      what: t("terms.tags").toLowerCase(),
                    })}
                  </Title>
                  <EmptyStateBody>
                    {t("composed.noDataStateBody", {
                      how: t("terms.create"),
                      what: t("terms.tags").toLowerCase(),
                    })}
                  </EmptyStateBody>
                </EmptyState>
              }
              numRenderedColumns={numRenderedColumns}
            >
              {currentPageItems?.map((tagCategory, rowIndex) => {
                const hasTags = tagCategory.tags && tagCategory.tags.length > 0;
                const categoryColor =
                  tagCategory.colour ||
                  getTagCategoryFallbackColor(tagCategory);

                return (
                  <Tbody
                    key={tagCategory.id}
                    isExpanded={isCellExpanded(tagCategory)}
                  >
                    <Tr {...getTrProps({ item: tagCategory })}>
                      <TableRowContentWithControls
                        {...tableControls}
                        item={tagCategory}
                        rowIndex={rowIndex}
                      >
                        <Td width={25} {...getTdProps({ columnKey: "name" })}>
                          {tagCategory.name}
                        </Td>
                        <Td width={10} {...getTdProps({ columnKey: "rank" })}>
                          {tagCategory.rank}
                        </Td>
                        <Td width={10} {...getTdProps({ columnKey: "color" })}>
                          <Color hex={categoryColor} />
                        </Td>
                        <Td
                          width={10}
                          {...getTdProps({ columnKey: "tagCount" })}
                        >
                          {tagCategory.tags?.length || 0}
                        </Td>
                        <Td width={20}>
                          <AppTableActionButtons
                            isDeleteEnabled={!!tagCategory.tags?.length}
                            tooltipMessage={t(
                              "message.cannotDeleteNonEmptyTagCategory"
                            )}
                            onEdit={() => setTagCategoryModalState(tagCategory)}
                            onDelete={() => setTagCategoryToDelete(tagCategory)}
                          />
                        </Td>
                      </TableRowContentWithControls>
                    </Tr>
                    {isCellExpanded(tagCategory) && (
                      <Tr>
                        <Td colSpan={numRenderedColumns}>
                          <ExpandableRowContent>
                            {hasTags ? (
                              <TagTable
                                tagCategory={tagCategory}
                                onEdit={setTagModalState}
                                onDelete={deleteTagFromTable}
                              />
                            ) : (
                              <EmptyState variant="sm">
                                <EmptyStateIcon icon={CubesIcon} />
                                <Title headingLevel="h4" size="lg">
                                  {t("message.noTagsAvailable")}
                                </Title>
                                <EmptyStateBody>
                                  {t("message.noAssociatedTags")}
                                </EmptyStateBody>
                              </EmptyState>
                            )}
                          </ExpandableRowContent>
                        </Td>
                      </Tr>
                    )}
                  </Tbody>
                );
              })}
            </ConditionalTableBody>
          </Table>
          <SimplePagination
            idPrefix="tag-category-table"
            isTop={false}
            paginationProps={paginationProps}
          />
        </div>
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

      {!!tagToDelete && (
        <ConfirmDialog
          title={t("dialog.title.deleteWithName", {
            what: t("terms.tag").toLowerCase(),
            name: tagToDelete.name,
          })}
          titleIconVariant={"warning"}
          message={t("dialog.message.delete")}
          isOpen={true}
          confirmBtnVariant={ButtonVariant.danger}
          confirmBtnLabel={t("actions.delete")}
          cancelBtnLabel={t("actions.cancel")}
          onCancel={() => setTagToDelete(undefined)}
          onClose={() => setTagToDelete(undefined)}
          onConfirm={() => {
            if (tagToDelete) {
              deleteTag(tagToDelete.id);
              setTagToDelete(undefined);
            }
          }}
        />
      )}
      {!!tagCategoryToDelete && (
        <ConfirmDialog
          title={t("dialog.title.deleteWithName", {
            what: t("terms.tagCategory").toLowerCase(),
            name: tagCategoryToDelete.name,
          })}
          titleIconVariant={"warning"}
          message={t("dialog.message.delete")}
          isOpen={true}
          confirmBtnVariant={ButtonVariant.danger}
          confirmBtnLabel={t("actions.delete")}
          cancelBtnLabel={t("actions.cancel")}
          onCancel={() => setTagCategoryToDelete(undefined)}
          onClose={() => setTagCategoryToDelete(undefined)}
          onConfirm={() => {
            if (tagCategoryToDelete) {
              deleteTagCategory(tagCategoryToDelete.id);
              setTagCategoryToDelete(undefined);
            }
          }}
        />
      )}
    </>
  );
};
