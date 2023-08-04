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
import { Target, TargetLabel } from "@app/api/models";
import { c_options_menu__toggle_BackgroundColor } from "@patternfly/react-tokens";

export const SetTargets: React.FC = () => {
  const { t } = useTranslation();

  const { targets } = useFetchTargets();

  const targetOrderSetting = useSetting("ui.target.order");

  const { watch, setValue, getValues } =
    useFormContext<AnalysisWizardFormValues>();
  const values = getValues();
  const formLabels = watch("formLabels");
  const formSources = watch("formSources");
  const formOtherLabels = watch("formOtherLabels");

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
    selectedLabelName: string
  ) => {
    console.log({ isSelecting, selectedLabelName });

    const otherSelectedLabels = formLabels?.filter((formLabel) => {
      return formLabel.name !== selectedLabelName;
    });
    console.log({ otherSelectedLabels, formLabels });
    if (isSelecting) {
      const matchingLabel =
        targets
          ?.find((target) => {
            const labelNames = target?.labels?.map((label) => label.name);
            return labelNames?.includes(selectedLabelName);
          })
          ?.labels?.find((label) => label.name === selectedLabelName) || "";

      matchingLabel &&
        setValue("formLabels", [...otherSelectedLabels, matchingLabel]);
    } else {
      // console.log("otherSelected", { otherSelectedLabels });
      setValue("formLabels", otherSelectedLabels);
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
      {/* {values.formRulesets.length === 0 &&
        values.customRulesFiles.length === 0 &&
        !values.sourceRepository && (
          <Alert
            variant="warning"
            isInline
            title={t("wizard.label.skipTargets")}
          />
        )} */}
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
                      onCardClick={(
                        isSelecting: boolean,
                        selectedLabelName: string
                      ) => {
                        handleOnCardClick(isSelecting, selectedLabelName);
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
