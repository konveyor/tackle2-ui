import React from "react";
import {
  Title,
  Stack,
  StackItem,
  TextContent,
  Text,
  Gallery,
  GalleryItem,
} from "@patternfly/react-core";
import { useTranslation } from "react-i18next";
import { useFormContext } from "react-hook-form";

import { SelectCard } from "./components/select-card";
import { ITransformationTargets, transformationTargets } from "./targets";

export const SetTargets: React.FC = () => {
  const { t } = useTranslation();

  const { getValues, setValue } = useFormContext();
  const targets: string[] = getValues("targets");

  const handleOnCardChange = (
    isNewCard: boolean,
    selectionValue: string,
    card: ITransformationTargets
  ) => {
    const selectedTargets = targets.filter(
      (target) => !card.options.includes(target)
    );

    if (isNewCard) setValue("targets", [...selectedTargets, selectionValue]);
    else setValue("targets", selectedTargets);
  };

  return (
    <>
      <TextContent>
        <Title headingLevel="h3" size="xl">
          {t("wizard.terms.setTargets")}
        </Title>
        <Text>{t("wizard.label.setTargets")}</Text>
      </TextContent>
      <Stack>
        <StackItem>
          <Gallery hasGutter>
            {transformationTargets.map((elem, index) => (
              <GalleryItem key={index}>
                <SelectCard
                  item={elem}
                  cardSelected={[...elem.options].some((key) =>
                    targets.includes(key)
                  )}
                  onChange={(isNewCard: boolean, selectionValue: string) => {
                    handleOnCardChange(isNewCard, selectionValue, elem);
                  }}
                />
              </GalleryItem>
            ))}
          </Gallery>
        </StackItem>
      </Stack>{" "}
    </>
  );
};
