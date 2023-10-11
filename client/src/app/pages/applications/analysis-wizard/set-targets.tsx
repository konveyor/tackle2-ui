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

import { TargetCard } from "@app/components/target-card/target-card";
import { AnalysisWizardFormValues } from "./schema";
import { useSetting } from "@app/queries/settings";
import { useFetchTargets } from "@app/queries/targets";
import { Target } from "@app/api/models";

export const SetTargets: React.FC = () => {
  const { t } = useTranslation();

  const { targets } = useFetchTargets();

  const targetOrderSetting = useSetting("ui.target.order");

  const { watch, setValue, getValues } =
    useFormContext<AnalysisWizardFormValues>();
  const values = getValues();
  const formLabels = watch("formLabels");
  const selectedTargets = watch("selectedTargets");

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
    const updatedSelectedTargets = getUpdatedSelectedTargets(
      isSelecting,
      target
    );

    const updatedFormLabels = getUpdatedFormLabels(
      isSelecting,
      selectedLabelName,
      target
    );

    setValue("formLabels", updatedFormLabels);
    setValue("selectedTargets", updatedSelectedTargets);
  };

  const getUpdatedSelectedTargets = (isSelecting: boolean, target: Target) => {
    const { selectedTargets } = values;
    if (isSelecting) {
      return [...selectedTargets, target.id];
    }
    return selectedTargets.filter((id) => id !== target.id);
  };

  const getUpdatedFormLabels = (
    isSelecting: boolean,
    selectedLabelName: string,
    target: Target
  ) => {
    const { formLabels } = values;
    if (target.custom) {
      const customTargetLabelNames = target.labels?.map((label) => label.name);
      const otherSelectedLabels = formLabels?.filter(
        (formLabel) => !customTargetLabelNames?.includes(formLabel.name)
      );
      return isSelecting && target.labels
        ? [...otherSelectedLabels, ...target.labels]
        : otherSelectedLabels;
    } else {
      const otherSelectedLabels = formLabels?.filter(
        (formLabel) => formLabel.name !== selectedLabelName
      );
      if (isSelecting) {
        const matchingLabel = target.labels?.find(
          (label) => label.name === selectedLabelName
        );
        return matchingLabel
          ? [...otherSelectedLabels, matchingLabel]
          : otherSelectedLabels;
      }
      return otherSelectedLabels;
    }
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
        {targetOrderSetting.isSuccess
          ? targetOrderSetting.data.map((id, index) => {
              const matchingTarget = targets.find((target) => target.id === id);

              const isSelected = selectedTargets?.includes(id);

              if (matchingTarget) {
                return (
                  <GalleryItem key={index}>
                    <TargetCard
                      readOnly
                      item={matchingTarget}
                      cardSelected={isSelected}
                      onSelectedCardTargetChange={(selectedTarget) => {
                        handleOnSelectedCardTargetChange(selectedTarget);
                      }}
                      onCardClick={(isSelecting, selectedLabelName, target) => {
                        handleOnCardClick(
                          isSelecting,
                          selectedLabelName,
                          target
                        );
                      }}
                      formLabels={formLabels}
                    />
                  </GalleryItem>
                );
              } else {
                return null;
              }
            })
          : null}
      </Gallery>
    </Form>
  );
};
