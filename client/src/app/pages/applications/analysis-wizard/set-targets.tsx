import React, { useState } from "react";
import {
  Title,
  TextContent,
  Text,
  Gallery,
  GalleryItem,
  Form,
  Alert,
  SelectOptionProps,
} from "@patternfly/react-core";
import { useTranslation } from "react-i18next";
import { useFormContext } from "react-hook-form";

import { TargetCard } from "@app/components/target-card/target-card";
import { AnalysisWizardFormValues } from "./schema";
import { useSetting } from "@app/queries/settings";
import { useFetchTargets } from "@app/queries/targets";
import { Application, TagCategory, Target } from "@app/api/models";
import { useFetchTagCategories } from "@app/queries/tags";
import { SimpleSelectCheckbox } from "@app/components/SimpleSelectCheckbox";
import { getUpdatedFormLabels, updateSelectedTargets } from "./utils";

interface SetTargetsProps {
  applications: Application[];
}

export const SetTargets: React.FC<SetTargetsProps> = ({ applications }) => {
  const { t } = useTranslation();

  const { targets } = useFetchTargets();

  const targetOrderSetting = useSetting("ui.target.order");

  const { watch, setValue, getValues } =
    useFormContext<AnalysisWizardFormValues>();

  const values = getValues();
  const formLabels = watch("formLabels");
  const selectedTargets = watch("selectedTargets");

  const { tagCategories } = useFetchTagCategories();

  const findCategoryForTag = (tagId: number) => {
    return tagCategories.find(
      (category: TagCategory) =>
        category.tags?.some((categoryTag) => categoryTag.id === tagId)
    );
  };

  const initialProviders = Array.from(
    new Set(
      applications
        .flatMap((app) => app.tags || [])
        .map((tag) => {
          return {
            category: findCategoryForTag(tag.id),
            tag,
          };
        })
        .filter((tagWithCat) => tagWithCat?.category?.name === "Language")
        .map((tagWithCat) => tagWithCat.tag.name)
    )
  ).filter(Boolean);

  const [providers, setProviders] = useState(initialProviders);

  const handleOnSelectedCardTargetChange = (selectedLabelName: string) => {
    const otherSelectedLabels = formLabels?.filter((formLabel) => {
      return formLabel.name !== selectedLabelName;
    });
    const matchingLabel =
      targets
        ?.find((target) => {
          const labelNames = target?.labels?.map((label) => label.name);
          return labelNames?.includes(selectedLabelName);
        })
        ?.labels?.find((label) => label.name === selectedLabelName) || "";

    const matchingOtherLabelNames =
      targets
        ?.find((target) => {
          const labelNames = target?.labels?.map((label) => label.name);
          return labelNames?.includes(selectedLabelName);
        })
        ?.labels?.filter((label) => label.name !== selectedLabelName)
        .map((label) => label.name) || "";

    const isNewLabel = !formLabels
      .map((label) => label.name)
      .includes(selectedLabelName);
    if (isNewLabel) {
      const filterConflictingLabels = otherSelectedLabels.filter(
        (label) => !matchingOtherLabelNames.includes(label.name)
      );
      matchingLabel &&
        setValue("formLabels", [...filterConflictingLabels, matchingLabel]);
    }
  };

  const handleOnCardClick = (
    isSelecting: boolean,
    selectedLabelName: string,
    target: Target
  ) => {
    const updatedSelectedTargets = updateSelectedTargets(
      target,
      selectedTargets
    );

    const updatedFormLabels = getUpdatedFormLabels(
      isSelecting,
      selectedLabelName,
      target,
      formLabels
    );

    setValue("formLabels", updatedFormLabels);
    setValue("selectedTargets", updatedSelectedTargets);
  };

  const allProviders = targets.flatMap((target) => target.provider);
  const languageOptions = Array.from(new Set(allProviders));

  const targetsToRender: Target[] = !targetOrderSetting.isSuccess
    ? []
    : targetOrderSetting.data
        .map((targetId) => targets.find((target) => target.id === targetId))
        .filter(Boolean)
        .filter((target) =>
          providers.some((p) => target.provider?.includes(p) ?? false)
        );

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
      <SimpleSelectCheckbox
        placeholderText="Filter by language..."
        width={300}
        value={providers}
        options={languageOptions?.map((language): SelectOptionProps => {
          return {
            children: <div>{language}</div>,
            value: language,
          };
        })}
        onChange={(selection) => {
          setProviders(selection as string[]);
        }}
        id="filter-by-language"
        toggleId="action-select-toggle"
      />

      {values.selectedTargets.length === 0 &&
        values.customRulesFiles.length === 0 &&
        !values.sourceRepository && (
          <Alert
            variant="warning"
            isInline
            title={t("wizard.label.skipTargets")}
          />
        )}

      <Gallery hasGutter>
        {targetsToRender.map((target) => (
          <GalleryItem key={target.id}>
            <TargetCard
              readOnly
              item={target}
              cardSelected={selectedTargets.some(({ id }) => id === target.id)}
              onSelectedCardTargetChange={(selectedTarget) => {
                handleOnSelectedCardTargetChange(selectedTarget);
              }}
              onCardClick={(isSelecting, selectedLabelName, target) => {
                handleOnCardClick(isSelecting, selectedLabelName, target);
              }}
              formLabels={formLabels}
            />
          </GalleryItem>
        ))}
      </Gallery>
    </Form>
  );
};
