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
  const formTargets = watch("formTargets");
  const formRuleBundles = watch("formRuleBundles");

  const handleOnCardClick = (
    isSelecting: boolean,
    selectedRuleTarget: string,
    selectedRuleBundle: RuleBundle
  ) => {
    const otherSelectedRuleTargets = formTargets.filter(
      (formTarget) =>
        !selectedRuleBundle.rulesets
          .map((rule) => rule.metadata.target)
          .includes(formTarget)
    );

    const otherSelectedRuleBundles = formRuleBundles.filter(
      (formRuleBundle) => selectedRuleBundle.id !== formRuleBundle.id
    );
    const selectedRuleBundleRef = {
      id: selectedRuleBundle.id,
      name: selectedRuleBundle.name,
    };

    if (isSelecting) {
      setValue("formTargets", [
        ...otherSelectedRuleTargets,
        selectedRuleTarget,
      ]);
      setValue("formRuleBundles", [
        ...otherSelectedRuleBundles,
        selectedRuleBundleRef,
      ]);
    } else {
      setValue("formTargets", otherSelectedRuleTargets);
      setValue("formRuleBundles", otherSelectedRuleBundles);
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
                    formTargets.includes(ruleset.metadata.target)
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
