import * as React from "react";
import {
  Checkbox,
  Form,
  Select,
  SelectOption,
  SelectVariant,
  Text,
  TextContent,
  Title,
} from "@patternfly/react-core";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import * as yup from "yup";

import { getValidatedFromErrorTouched } from "@app/utils/utils";
import { defaultTargets } from "../../../data/targets";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import { AnalysisWizardFormValues } from "./schema";
import { HookFormPFGroupController } from "@app/shared/components/hook-form-pf-fields";
import { StringListField } from "@app/shared/components/string-list-field";
import { useFetchRuleBundles } from "@app/queries/rulebundles";
import { getruleBundleTargetList } from "@app/common/CustomRules/rules-utils";

export const SetOptions: React.FC = () => {
  const { t } = useTranslation();

  const { watch, control, setValue, getValues } =
    useFormContext<AnalysisWizardFormValues>();

  const {
    formSources,
    selectedFormSources,
    formTargets,
    formRuleBundles,
    diva,
    excludedRulesTags,
    autoTaggingEnabled,
  } = watch();

  const [isSelectTargetsOpen, setSelectTargetsOpen] = React.useState(false);
  const [isSelectSourcesOpen, setSelectSourcesOpen] = React.useState(false);
  const { ruleBundles } = useFetchRuleBundles();

  const allRuleBundleTargets = ruleBundles
    .map((ruleBundle) => getruleBundleTargetList(ruleBundle))
    .flat();

  const defaultTargetsAndBundleTargets = [
    ...new Set(defaultTargets.concat(allRuleBundleTargets)),
  ];

  return (
    <Form
      isHorizontal
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      <TextContent>
        <Title headingLevel="h3" size="xl">
          {t("wizard.title.advancedOptions")}
        </Title>
        <Text>{t("wizard.label.advancedOptions")}</Text>
      </TextContent>
      <HookFormPFGroupController
        control={control}
        name="formTargets"
        label={t("wizard.terms.targets")}
        fieldId="targets"
        isRequired
        renderInput={({
          field: { onChange, onBlur, value: selectedFormTargets },
          fieldState: { isTouched, error },
        }) => (
          <Select
            id="ruleBundles"
            toggleId="rule-bundles-toggle"
            variant={SelectVariant.typeaheadMulti}
            aria-label="Select targets"
            selections={formTargets}
            isOpen={isSelectTargetsOpen}
            onSelect={(_, selection) => {
              const matchingRuleBundle = ruleBundles.find((ruleBundle) =>
                getruleBundleTargetList(ruleBundle).includes(
                  selection as string
                )
              );
              if (!formTargets.includes(selection as string)) {
                onChange([...selectedFormTargets, selection]);
                if (matchingRuleBundle)
                  setValue("formRuleBundles", [
                    ...formRuleBundles,
                    matchingRuleBundle,
                  ]);
              } else {
                if (matchingRuleBundle)
                  setValue(
                    "formRuleBundles",
                    formRuleBundles.filter(
                      (formRuleBundle) =>
                        formRuleBundle.name !== matchingRuleBundle.name
                    )
                  );
                onChange(
                  selectedFormTargets.filter(
                    (formTarget) => formTarget !== selection
                  )
                );
              }
              onBlur();
              setSelectTargetsOpen(!isSelectTargetsOpen);
            }}
            onToggle={() => {
              setSelectTargetsOpen(!isSelectTargetsOpen);
            }}
            onClear={() => {
              onChange([]);
            }}
            validated={getValidatedFromErrorTouched(error, isTouched)}
          >
            {defaultTargetsAndBundleTargets.map((targetName, index) => (
              <SelectOption key={index} component="button" value={targetName} />
            ))}
          </Select>
        )}
      />
      <HookFormPFGroupController
        control={control}
        name="selectedFormSources"
        label={t("wizard.terms.sources")}
        fieldId="sources"
        renderInput={({
          field: { onChange, onBlur, value },
          fieldState: { isTouched, error },
        }) => (
          <Select
            id="formSources-id"
            toggleId="sources-toggle"
            variant={SelectVariant.typeaheadMulti}
            aria-label="Select sources"
            selections={value}
            isOpen={isSelectSourcesOpen}
            onSelect={(_, selection) => {
              if (!value.includes(selection as string)) {
                onChange([...selectedFormSources, selection] as string[]);
              } else {
                onChange(
                  selectedFormSources.filter(
                    (source: string) => source !== selection
                  )
                );
              }
              onBlur();
              setSelectSourcesOpen(!isSelectSourcesOpen);
            }}
            onToggle={() => {
              setSelectSourcesOpen(!isSelectSourcesOpen);
            }}
            onClear={() => {
              onChange([]);
            }}
            validated={getValidatedFromErrorTouched(error, isTouched)}
          >
            {formSources.map((source, index) => (
              <SelectOption key={index} component="button" value={source} />
            ))}
          </Select>
        )}
      />
      <StringListField
        listItems={excludedRulesTags}
        setListItems={(items) => setValue("excludedRulesTags", items)}
        itemToAddSchema={yup
          .string()
          .min(2, t("validation.minLength", { length: 2 }))
          .max(60, t("validation.maxLength", { length: 60 }))}
        itemToAddFieldId="ruleTagToExclude"
        itemToAddLabel={t("wizard.composed.excluded", {
          what: t("wizard.terms.rulesTags"),
        })}
        itemToAddAriaLabel="Add a rule tag to exclude" // TODO translation here
        itemNotUniqueMessage="This rule tag is already excluded" // TODO translation here
        removeItemButtonId={(tag) => `remove-${tag}-from-excluded-rules-tags`}
        className={spacing.mtMd}
      />
      <Checkbox
        className={spacing.mtMd}
        label={t("wizard.composed.enable", {
          what: t("wizard.terms.transactionReport").toLowerCase(),
        })}
        isChecked={diva}
        onChange={() => setValue("diva", !diva)}
        id="enable-transaction-report-checkbox"
        name="enableTransactionReport"
      />
      <Checkbox
        className={spacing.mtMd}
        label={t("wizard.composed.enable", {
          what: t("wizard.terms.autoTagging").toLowerCase(),
        })}
        isChecked={autoTaggingEnabled}
        onChange={() => setValue("autoTaggingEnabled", !autoTaggingEnabled)}
        id="enable-auto-tagging-checkbox"
        name="autoTaggingEnabled"
      />
    </Form>
  );
};
