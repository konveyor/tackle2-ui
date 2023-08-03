import React from "react";
import {
  Title,
  TextContent,
  Text,
  Gallery,
  GalleryItem,
  Form,
  Alert,
} from "@patternfly/react-core";
import { useTranslation } from "react-i18next";
import { useFormContext } from "react-hook-form";

import { TargetCard } from "@app/components/target-card";
import { AnalysisWizardFormValues } from "./schema";
import { useSetting } from "@app/queries/settings";
import { Ruleset, Target } from "@app/api/models";
import { useFetchTargets } from "@app/queries/targets";

export const SetTargets: React.FC = () => {
  const { t } = useTranslation();

  const { targets } = useFetchTargets();

  const targetOrderSetting = useSetting("ui.target.order");

  const { watch, setValue, getValues } =
    useFormContext<AnalysisWizardFormValues>();
  const values = getValues();
  const formTargets = watch("formTargets");
  const formRulesets = watch("formRulesets");
  const formSources = watch("formSources");
  const formOtherLabels = watch("formOtherLabels");

  const handleOnSelectedCardTargetChange = (
    selectedRuleTarget: string,
    selectedTarget: Target
  ) => {
    const otherSelectedRuleTargets = formTargets.filter(
      (formTarget) =>
        !selectedTarget.ruleset.rules
          .map((rule) => rule?.metadata?.target)
          .includes(formTarget)
    );
    const definedSelectedTargets: string[] =
      selectedTarget.ruleset.kind === "category"
        ? [selectedRuleTarget]
        : selectedTarget.ruleset.rules
            .map((rulesets) => rulesets?.metadata?.target || "")
            .filter((target) => !!target);

    setValue("formTargets", [
      ...otherSelectedRuleTargets,
      ...definedSelectedTargets,
    ]);
  };

  const handleOnCardClick = (
    isSelecting: boolean,
    selectedRuleTarget: string,
    selectedRuleset: Ruleset
  ) => {
    const otherSelectedRuleSources = formSources.filter(
      (formSource) =>
        !selectedRuleset.rules
          .map((rule) => rule?.metadata?.source)
          .includes(formSource)
    );
    const otherSelectedRuleTargets = formTargets.filter(
      (formTarget) =>
        !selectedRuleset.rules
          .map((rule) => rule?.metadata?.target)
          .includes(formTarget)
    );

    const otherSelectedRulesets = formRulesets.filter(
      (formRuleset) => selectedRuleset.id !== formRuleset.id
    );

    const otherSelectedOtherLabels = formOtherLabels.filter(
      (label) =>
        !selectedRuleset.rules
          .flatMap((rule) => rule?.metadata?.otherLabels)
          .includes(label)
    );

    if (isSelecting) {
      const definedSelectedOtherLabels: string[] = Array.from(
        new Set(
          selectedRuleset.rules
            .flatMap((rulesets) => rulesets?.metadata?.otherLabels || "")
            .filter((otherLabel) => otherLabel!)
        )
      );

      setValue("formOtherLabels", [
        ...otherSelectedOtherLabels,
        ...definedSelectedOtherLabels,
      ]);

      const definedSelectedSources: string[] = Array.from(
        new Set(
          selectedRuleset.rules
            .map((rulesets) => rulesets?.metadata?.source || "")
            .filter((source) => !!source)
        )
      );

      setValue("formSources", [
        ...otherSelectedRuleSources,
        ...definedSelectedSources,
      ]);

      const definedSelectedTargets: string[] = Array.from(
        new Set(
          selectedRuleset.kind === "category"
            ? [selectedRuleTarget]
            : selectedRuleset.rules
                .map((rulesets) => rulesets?.metadata?.target || "")
                .filter((target) => !!target)
        )
      );

      setValue("formTargets", [
        ...otherSelectedRuleTargets,
        ...definedSelectedTargets,
      ]);

      setValue("formRulesets", [...otherSelectedRulesets, selectedRuleset]);
    } else {
      setValue("formSources", otherSelectedRuleSources);
      setValue("formTargets", otherSelectedRuleTargets);
      setValue("formRulesets", otherSelectedRulesets);
      setValue("formOtherLabels", otherSelectedOtherLabels);
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
      {values.formRulesets.length === 0 &&
        values.customRulesFiles.length === 0 &&
        !values.sourceRepository && (
          <Alert
            variant="warning"
            isInline
            title={t("wizard.label.skipTargets")}
          />
        )}
      <Gallery hasGutter>
        {targetOrderSetting.isSuccess
          ? targetOrderSetting.data.map((id, index) => {
              const matchingTarget = targets.find((target) => target.id === id);
              if (matchingTarget) {
                return (
                  <GalleryItem key={index}>
                    <TargetCard
                      readOnly
                      item={matchingTarget}
                      cardSelected={formRulesets
                        .map((formRuleset) => formRuleset.name)
                        .includes(matchingTarget.name)}
                      onSelectedCardTargetChange={(
                        selectedRuleTarget: string
                      ) => {
                        handleOnSelectedCardTargetChange(
                          selectedRuleTarget,
                          matchingTarget
                        );
                      }}
                      onCardClick={(
                        isSelecting: boolean,
                        selectedRuleTarget: string
                      ) => {
                        handleOnCardClick(
                          isSelecting,
                          selectedRuleTarget,
                          matchingTarget
                        );
                      }}
                      formTargets={formTargets}
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
