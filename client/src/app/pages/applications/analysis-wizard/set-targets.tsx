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
    if (target.custom) {
      const customTargetLabelNames = target.labels?.map((label) => label.name);
      const otherSelectedLabels = formLabels?.filter((formLabel) => {
        return !customTargetLabelNames?.includes(formLabel.name);
      });
      if (isSelecting && target?.labels) {
        setValue("formLabels", [...otherSelectedLabels, ...target.labels]);
      } else {
        setValue("formLabels", otherSelectedLabels);
      }
    } else {
      const otherSelectedLabels = formLabels?.filter((formLabel) => {
        return formLabel.name !== selectedLabelName;
      });
      if (isSelecting) {
        const matchingLabel =
          target.labels?.find((label) => label.name === selectedLabelName) ||
          "";

        matchingLabel &&
          setValue("formLabels", [...otherSelectedLabels, matchingLabel]);
      } else {
        setValue("formLabels", otherSelectedLabels);
      }
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
              const matchingLabelNames =
                matchingTarget?.labels?.map((label) => label.name) || [];

              const isSelected = formLabels?.some((label) =>
                matchingLabelNames.includes(label.name)
              );
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
