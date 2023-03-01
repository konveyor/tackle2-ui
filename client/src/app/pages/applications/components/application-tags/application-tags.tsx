import React, { useEffect, useState } from "react";

import { ConditionalRender } from "@app/shared/components";

import { Application, Tag, TagCategory } from "@app/api/models";
import { getTagById, getTagCategoryById } from "@app/api/rest";
import {
  Label,
  LabelGroup,
  Spinner,
  Split,
  SplitItem,
} from "@patternfly/react-core";
import { DEFAULT_COLOR_LABELS } from "@app/Constants";

export interface ApplicationTagsProps {
  application: Application;
}

export const ApplicationTags: React.FC<ApplicationTagsProps> = ({
  application,
}) => {
  const [tagCategories, setTagCategories] = useState<Map<number, TagCategory>>(
    new Map()
  );
  const [tags, setTags] = useState<Map<number, Tag[]>>(new Map());

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
          const newTagCategories: Map<number, TagCategory> = new Map();
          const newTags: Map<number, Tag[]> = new Map();

          const tagValidResponses = tags.reduce((prev, current) => {
            if (current) {
              return [...prev, current.data];
            } else {
              return prev;
            }
          }, [] as Tag[]);

          Promise.all(
            tagValidResponses.map((tag) =>
              getTagCategoryById(tag?.category?.id || 0)
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
            tagValidResponses.forEach((tag) => {
              const tagCategoryRef = tag.category;
              if (tagCategoryRef?.id) {
                const thisTagsFullTagCategory = tagCategoryValidResponses.find(
                  (tagCategory) => tagCategory.id === tagCategoryRef?.id
                );
                const tagCategoryWithColour: TagCategory = {
                  ...tagCategoryRef,
                  colour: thisTagsFullTagCategory?.colour || "",
                };
                newTagCategories.set(
                  tagCategoryWithColour.id!,
                  tagCategoryWithColour
                );

                // // // Tags
                newTags.set(tagCategoryWithColour.id!, [
                  ...(newTags.get(tagCategoryWithColour.id!) || []),
                  tag,
                ]);
              }
            });

            setTagCategories(newTagCategories);
            setTags(newTags);

            setIsFetching(false);
          });
        })
        .catch(() => {
          setIsFetching(false);
        });
    } else {
      setTagCategories(new Map());
      setTags(new Map());
    }
  }, [application]);

  return (
    <ConditionalRender when={isFetching} then={<Spinner isSVG size="md" />}>
      <Split hasGutter>
        {Array.from(tagCategories.values())
          .sort((a, b) => (a.rank || 0) - (b.rank || 0))
          .map((tagCategory) => {
            return (
              <SplitItem key={tagCategory.id}>
                <LabelGroup numLabels={10}>
                  {tags
                    .get(tagCategory.id!)
                    ?.sort((a, b) => a.name.localeCompare(b.name))
                    .map((tag) => {
                      const colorLabel = DEFAULT_COLOR_LABELS.get(
                        tagCategory?.colour || ""
                      );

                      return (
                        <Label key={tag.id} color={colorLabel as any}>
                          {tag.name}
                        </Label>
                      );
                    })}
                </LabelGroup>
              </SplitItem>
            );
          })}
      </Split>
    </ConditionalRender>
  );
};
