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
import {
  useFetchBundleOrder,
  useFetchRuleBundles,
} from "@app/queries/rulebundles";
import { RuleBundle } from "@app/api/models";

export const SetTargets: React.FC = () => {
  const { t } = useTranslation();

  const {
    ruleBundles,
    isFetching: isFetchingRuleBundles,
    refetch: refetchRuleBundles,
  } = useFetchRuleBundles();

  const {
    bundleOrderSetting,
    isFetching,
    refetch: refreshBundleOrderSetting,
  } = useFetchBundleOrder(ruleBundles);

  const { watch, setValue } = useFormContext<AnalysisWizardFormValues>();
  const targets = watch("targets");

  const handleOnCardClick = (
    isSelecting: boolean,
    selectedRuleTarget: string,
    selectedRuleBundle: RuleBundle
  ) => {
    const selectedRuleTargets = targets.filter(
      (target) =>
        !selectedRuleBundle.rulesets
          .map((rule) => rule.metadata.target)
          .includes(target)
    );

    if (isSelecting)
      setValue("targets", [...selectedRuleTargets, selectedRuleTarget]);
    else setValue("targets", selectedRuleTargets);
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
        {bundleOrderSetting.value.map((id, index) => {
          const matchingRuleBundle = ruleBundles.find(
            (target) => target.id === id
          );
          return (
            <GalleryItem key={index}>
              {matchingRuleBundle && (
                <TargetCard
                  readOnly
                  item={matchingRuleBundle}
                  cardSelected={matchingRuleBundle.rulesets.some((ruleset) =>
                    targets.includes(ruleset.metadata.target)
                  )}
                  onCardClick={(
                    isSelecting: boolean,
                    selectedRuleTarget: string
                  ) => {
                    handleOnCardClick(
                      isSelecting,
                      selectedRuleTarget,
                      matchingRuleBundle
                    );
                  }}
                />
              )}
            </GalleryItem>
          );
        })}
      </Gallery>
    </Form>
  );
};
