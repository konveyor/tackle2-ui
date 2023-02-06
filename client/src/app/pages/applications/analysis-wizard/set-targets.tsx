import React from "react";
import {
  Title,
  TextContent,
  Text,
  Gallery,
  GalleryItem,
  Form,
} from "@patternfly/react-core";
import { useTranslation } from "react-i18next";
import { useFormContext } from "react-hook-form";

import { TargetCard } from "@app/components/target-card";
import {
  ITransformationTargets,
  transformationTargets,
} from "@app/data/targets";
import { AnalysisWizardFormValues } from "./schema";

export const SetTargets: React.FC = () => {
  const { t } = useTranslation();

  const { watch, setValue } = useFormContext<AnalysisWizardFormValues>();
  const targets = watch("targets");

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
    <Form
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      <TextContent>
        <Title headingLevel="h3" size="xl">
          {t("wizard.terms.setTargets")}
        </Title>
        <Text>{t("wizard.label.setTargets")}</Text>
      </TextContent>
      <Gallery hasGutter>
        {transformationTargets.map((elem, index) => (
          <GalleryItem key={index}>
            <TargetCard
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
    </Form>
  );
};
