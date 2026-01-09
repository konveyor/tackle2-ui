import { useTranslation } from "react-i18next";
import { LabelGroup } from "@patternfly/react-core";

import { Tag } from "@app/api/models";
import { useFetchTagCategories } from "@app/queries/tags";

import { ItemTagLabel } from "../item-tag-label/item-tag-label";

export function LabelsFromTags({
  tags,
  noneMessage,
}: {
  tags?: Tag[];
  noneMessage?: string;
}): JSX.Element {
  const { t } = useTranslation();
  const { tagCategories } = useFetchTagCategories();

  const findCategoryForTag = (tagId: number) => {
    return tagCategories.find((category) =>
      category.tags?.some((categoryTag) => categoryTag.id === tagId)
    );
  };

  if (tags && tags.length > 0) {
    return (
      <LabelGroup>
        {tags.map((tag) => {
          const tagCategory = findCategoryForTag(tag.id);

          if (!tagCategory) return null;

          return <ItemTagLabel key={tag.id} tag={tag} category={tagCategory} />;
        })}
      </LabelGroup>
    );
  }

  return <div>{noneMessage || t("terms.none")}</div>;
}
