import React, { useEffect, useState } from "react";
import {
  Flex,
  Label,
  Spinner,
  TextContent,
  Text,
} from "@patternfly/react-core";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import textStyles from "@patternfly/react-styles/css/utilities/Text/text";
import { DEFAULT_COLOR_LABELS } from "@app/Constants";
import { ConditionalRender } from "@app/shared/components";
import { Application, Tag, TagCategory } from "@app/api/models";
import { getTagById, getTagCategoryById } from "@app/api/rest";

export interface ApplicationTagsProps {
  application: Application;
}

export const ApplicationTags: React.FC<ApplicationTagsProps> = ({
  application,
}) => {
  const [tags, setTags] = useState<Tag[]>([]);
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
          const tagValidResponses = tags.reduce((prev, current) => {
            if (current) {
              return [...prev, current.data];
            } else {
              return prev;
            }
          }, [] as Tag[]);
          const tagCategoryIds = new Set<number>();
          tagValidResponses.forEach(
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
                  return [...prev, current.data];
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

            setTags(tagValidResponses);
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

  const tagsById = new Map<number, Tag>();
  tags.forEach((tag) => tagsById.set(tag.id!, tag));
  const tagsBySource = new Map<string, Tag[]>();
  application.tags?.forEach((tagRef) => {
    const tag = tagRef.id ? tagsById.get(tagRef.id) : undefined;
    if (tag) {
      const tagsByThisSource = tagsBySource.get(tagRef.source || "");
      if (tagsByThisSource) {
        tagsByThisSource.push(tag);
      } else {
        tagsBySource.set(tagRef.source || "", [tag]);
      }
    }
  });

  return (
    <ConditionalRender when={isFetching} then={<Spinner isSVG size="md" />}>
      {Array.from(tagsBySource.keys())
        .sort((a, b) => {
          // Always put Manual tags (source === "") first
          if (a === "") return -1;
          if (b === "") return 1;
          return a.localeCompare(b);
        })
        .map((source) => {
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
                  {source === "" ? "Manual" : source}
                </Text>
              </TextContent>
              {Array.from(tagCategoriesInThisSource).map((tagCategory) => {
                const tagsInThisCategoryInThisSource = tagsInThisSource?.filter(
                  (tag) => tag.category?.id === tagCategory.id
                );
                return (
                  <React.Fragment key={tagCategory.id}>
                    <TextContent>
                      <Text
                        component="h4"
                        className={`${spacing.mtSm} ${spacing.mbSm} ${textStyles.fontSizeSm} ${textStyles.fontWeightLight}`}
                      >
                        {tagCategory.name}
                      </Text>
                    </TextContent>
                    <Flex>
                      {tagsInThisCategoryInThisSource
                        ?.sort((a, b) => a.name.localeCompare(b.name))
                        .map((tag) => {
                          const colorLabel = DEFAULT_COLOR_LABELS.get(
                            tagCategory?.colour || ""
                          );
                          return (
                            <Label
                              key={tag.id}
                              color={colorLabel as any}
                              className={`${spacing.mrSm} ${spacing.mbSm}`}
                            >
                              {tag.name}
                            </Label>
                          );
                        })}
                    </Flex>
                  </React.Fragment>
                );
              })}
            </React.Fragment>
          );
        })}
    </ConditionalRender>
  );
};
