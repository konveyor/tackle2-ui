import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Flex,
  Spinner,
  TextContent,
  Text,
  Toolbar,
  ToolbarContent,
  ToolbarToggleGroup,
  ToolbarItem,
  ButtonVariant,
  Bullseye,
} from "@patternfly/react-core";

import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import textStyles from "@patternfly/react-styles/css/utilities/Text/text";
import FilterIcon from "@patternfly/react-icons/dist/esm/icons/filter-icon";
import { ConditionalRender } from "@app/components/ConditionalRender";
import { NoDataEmptyState } from "@app/components/NoDataEmptyState";
import { Application, Tag, TagCategory } from "@app/api/models";
import { getTagById, getTagCategoryById } from "@app/api/rest";
import {
  FilterCategory,
  FilterToolbar,
  FilterType,
} from "@app/components/FilterToolbar";
import { useLegacyFilterState } from "@app/hooks/useLegacyFilterState";
import { useHistory } from "react-router-dom";
import { ItemTagLabel } from "../../../../components/labels/item-tag-label/item-tag-label";
import { capitalizeFirstLetter } from "@app/utils/utils";

interface TagWithSource extends Tag {
  source?: string;
}

const compareSources = (a: string, b: string) => {
  // Always put Manual tags (source === "") first
  if (a === "") return -1;
  if (b === "") return 1;
  return a.localeCompare(b);
};

export interface ApplicationTagsProps {
  application: Application;
}

export const ApplicationTags: React.FC<ApplicationTagsProps> = ({
  application,
}) => {
  const { t } = useTranslation();
  const history = useHistory();

  const [tags, setTags] = useState<TagWithSource[]>([]);
  const [tagCategoriesById, setTagCategoriesById] = useState<
    Map<number, TagCategory>
  >(new Map());

  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    if (application.tags) {
      setIsFetching(true);

      Promise.all(
        application.tags
          .map((f) => getTagById(f?.id || ""))
          .map((p) => p.catch(() => null))
      )
        .then((tags) => {
          const tagsWithSources = tags.reduce((prev, current, index) => {
            if (current) {
              const currentTagWithSource: TagWithSource = {
                ...current,
                source: application.tags?.[index].source,
              };
              return [...prev, currentTagWithSource];
            } else {
              // Filter out error responses
              return prev;
            }
          }, [] as Tag[]);
          const tagCategoryIds = new Set<number>();
          tagsWithSources.forEach(
            (tag) => tag.category?.id && tagCategoryIds.add(tag.category?.id)
          );
          Promise.all(
            Array.from(tagCategoryIds).map((tagCategoryId) =>
              getTagCategoryById(tagCategoryId)
            )
          ).then((tagCategories) => {
            // Tag categories
            const tagCategoryValidResponses = tagCategories.reduce(
              (prev, current) => {
                if (current) {
                  return [...prev, current];
                } else {
                  return prev;
                }
              },
              [] as TagCategory[]
            );

            const newTagCategoriesById = new Map<number, TagCategory>();
            tagCategoryValidResponses.forEach((tagCategory) =>
              newTagCategoriesById.set(tagCategory.id!, tagCategory)
            );

            setTags(tagsWithSources);
            setTagCategoriesById(newTagCategoriesById);

            setIsFetching(false);
          });
        })
        .catch(() => {
          setIsFetching(false);
        });
    } else {
      setTags([]);
      setTagCategoriesById(new Map());
    }
  }, [application]);

  const sources = new Set<string>();
  tags.forEach((tag) => sources.add(tag.source || ""));

  const filterCategories: FilterCategory<
    TagWithSource,
    "source" | "tagCategory"
  >[] = [
    {
      key: "source",
      title: t("terms.source"),
      type: FilterType.multiselect,
      placeholderText: t("terms.source"),
      getItemValue: (tag) => tag.source || "Manual",
      selectOptions: Array.from(sources)
        .sort(compareSources)
        .map((source) => source || "Manual")
        .map((source) => ({ key: source, value: source })),
      logicOperator: "OR",
    },
    {
      key: "tagCategory",
      title: t("terms.tagCategory"),
      type: FilterType.multiselect,
      placeholderText: t("terms.tagCategory"),
      getItemValue: (tag) => tag.category?.name || "",
      selectOptions: Array.from(tagCategoriesById.values())
        .map((tagCategory) => tagCategory.name)
        .sort((a, b) => a.localeCompare(b))
        .map((tagCategoryName) => ({
          key: tagCategoryName,
          value: tagCategoryName,
        })),
      logicOperator: "OR",
    },
  ];

  const {
    filterValues,
    setFilterValues,
    filteredItems: filteredTags,
  } = useLegacyFilterState(tags, filterCategories);

  const tagsBySource = new Map<string, Tag[]>();
  filteredTags.forEach((tag) => {
    const tagsInThisSource = tagsBySource.get(tag.source || "");
    if (tagsInThisSource) {
      tagsInThisSource.push(tag);
    } else {
      tagsBySource.set(tag.source || "", [tag]);
    }
  });

  return !!tagsBySource.size || isFetching ? (
    <ConditionalRender
      when={isFetching}
      then={
        <Bullseye className={spacing.mtLg}>
          <Spinner size="xl">Loading...</Spinner>
        </Bullseye>
      }
    >
      <Toolbar
        clearAllFilters={() => setFilterValues({})}
        clearFiltersButtonText={t("actions.clearAllFilters")}
      >
        <ToolbarContent className={spacing.p_0}>
          <ToolbarItem>Filter by:</ToolbarItem>
          <ToolbarToggleGroup toggleIcon={<FilterIcon />} breakpoint="xl">
            <FilterToolbar
              filterCategories={filterCategories}
              filterValues={filterValues}
              setFilterValues={setFilterValues}
              showFiltersSideBySide
            />
          </ToolbarToggleGroup>
        </ToolbarContent>
      </Toolbar>

      {Array.from(tagsBySource.keys())
        .sort(compareSources)
        .map((source, tagSourceIndex) => {
          const tagsInThisSource = tagsBySource.get(source);
          const tagCategoriesInThisSource = new Set<TagCategory>();
          tagsInThisSource?.forEach((tag) => {
            const category =
              tag?.category?.id && tagCategoriesById.get(tag?.category?.id);
            category && tagCategoriesInThisSource.add(category);
          });
          return (
            <React.Fragment key={source}>
              <TextContent>
                <Text
                  component="h3"
                  className={`${spacing.mtSm} ${spacing.mbSm} ${textStyles.fontSizeMd}`}
                >
                  {source === "" ? "Manual" : capitalizeFirstLetter(source)}
                </Text>
              </TextContent>
              {Array.from(tagCategoriesInThisSource).map((tagCategory) => {
                const tagsInThisCategoryInThisSource =
                  tagsInThisSource?.filter(
                    (tag) => tag.category?.id === tagCategory.id
                  ) || [];
                return (
                  <React.Fragment key={tagCategory.id}>
                    {/* TODO PF V5 - Verify fontWeight change */}
                    <TextContent>
                      <Text
                        component="h4"
                        className={`${spacing.mtSm} ${spacing.mbSm} ${textStyles.fontSizeSm} ${textStyles.fontWeightNormal}`}
                      >
                        {tagCategory.name}
                      </Text>
                    </TextContent>
                    <Flex>
                      {tagsInThisCategoryInThisSource.map((tag) => (
                        <ItemTagLabel
                          key={tag.id}
                          tag={tag}
                          category={tagCategoriesById.get(
                            tag?.category?.id || 0
                          )}
                          className={spacing.mXs}
                        />
                      ))}
                    </Flex>
                  </React.Fragment>
                );
              })}
            </React.Fragment>
          );
        })}
    </ConditionalRender>
  ) : (
    <>
      <NoDataEmptyState
        title={t("composed.noDataStateTitle", {
          what: "tags",
        })}
        description={t("message.toTagApplication")}
      />
      <div className="pf-v5-u-text-align-center">
        <Button
          type="button"
          id="create-tags"
          aria-label="Create Tags"
          variant={ButtonVariant.primary}
          onClick={() => {
            history.push("/controls/tags");
          }}
        >
          {t("actions.createTag")}
        </Button>
      </div>
    </>
  );
};
