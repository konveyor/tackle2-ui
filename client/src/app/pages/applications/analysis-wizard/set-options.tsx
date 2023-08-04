import * as React from "react";
import {
  Checkbox,
  Form,
  Text,
  TextContent,
  Title,
} from "@patternfly/react-core";
import {
  SelectVariant,
  Select,
  SelectOption,
} from "@patternfly/react-core/deprecated";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import * as yup from "yup";

import { getValidatedFromErrors } from "@app/utils/utils";
import { defaultTargets } from "../../../data/targets";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import { AnalysisWizardFormValues } from "./schema";
import { HookFormPFGroupController } from "@app/shared/components/hook-form-pf-fields";
import { StringListField } from "@app/shared/components/string-list-field";
import {
  getAllLabelsFromTarget,
  getParsedLabel,
} from "@app/common/CustomRules/rules-utils";
import { DEFAULT_SELECT_MAX_HEIGHT } from "@app/Constants";
import { useFetchTargets } from "@app/queries/targets";

export const SetOptions: React.FC = () => {
  const { t } = useTranslation();

  const { watch, control, setValue, getValues } =
    useFormContext<AnalysisWizardFormValues>();

  const {
    formSources,
    selectedFormSources,
    formLabels,
    diva,
    excludedRulesTags,
    autoTaggingEnabled,
  } = watch();

  const [isSelectTargetsOpen, setSelectTargetsOpen] = React.useState(false);
  const [isSelectSourcesOpen, setSelectSourcesOpen] = React.useState(false);
  const { targets } = useFetchTargets();

  const allLabelsFromTargets = targets
    .map((target) => getAllLabelsFromTarget(target))
    .filter(Boolean)
    .flat();

  const allTargetLabelsFromTargets = allLabelsFromTargets.filter((label) => {
    const parsedLabel = getParsedLabel(label?.label);
    if (parsedLabel.labelType === "target") {
      return parsedLabel.labelValue;
    }
  });

  const defaultTargetsAndTargets = [
    ...new Set(
      defaultTargets.concat(
        allTargetLabelsFromTargets.map((label) => label.label)
      )
    ),
  ];
  console.log("formLabels", formLabels);

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
        name="formLabels"
        label={t("wizard.terms.targets")}
        fieldId="target-labels"
        renderInput={({
          field: { onChange, onBlur, value: selectedFormTargets },
          fieldState: { isDirty, error },
        }) => {
          const selections = formLabels.map((formLabel) => {
            const parsedLabel = getParsedLabel(formLabel?.label);
            console.log("parsedLabel", parsedLabel);
            if (parsedLabel.labelType === "target") {
              console.log("parsedLabel is target", parsedLabel.labelValue);
              return parsedLabel.labelValue;
            }
          });
          console.log("selections", selections);
          return (
            <Select
              id="targets"
              toggleId="targets-toggle"
              variant={SelectVariant.typeaheadMulti}
              maxHeight={DEFAULT_SELECT_MAX_HEIGHT}
              aria-label="Select targets"
              selections={selections}
              isOpen={isSelectTargetsOpen}
              // onSelect={(_, selection) => {
              //   const selectionWithLabelSelector = `konveyor.io/target=${selection}`;
              //   const matchingTarget = targets.find((target) =>
              //     getTargetLabelList(target).includes(selectionWithLabelSelector)
              //   );
              //   if (!formTargets.includes(selectionWithLabelSelector)) {
              //     onChange([...selectedFormTargets, selectionWithLabelSelector]);
              //     if (matchingTarget)
              //       setValue("formRulesets", [...formRulesets, matchingTarget]);
              //   } else {
              //     if (matchingTarget)
              //       setValue(
              //         "formRulesets",
              //         formRulesets.filter(
              //           (formRuleset) => formRuleset.name !== matchingRuleset.name
              //         )
              //       );
              //     onChange(
              //       selectedFormTargets.filter(
              //         (formTarget) => formTarget !== selectionWithLabelSelector
              //       )
              //     );
              //   }
              //   onBlur();
              //   setSelectTargetsOpen(!isSelectTargetsOpen);
              // }}
              onToggle={() => {
                setSelectTargetsOpen(!isSelectTargetsOpen);
              }}
              onClear={() => {
                onChange([]);
              }}
              validated={getValidatedFromErrors(error, isDirty)}
            >
              {defaultTargetsAndTargets.map((targetName, index) => (
                <SelectOption
                  key={index}
                  component="button"
                  value={getParsedLabel(targetName).labelValue}
                />
              ))}
            </Select>
          );
        }}
      />
      <HookFormPFGroupController
        control={control}
        name="selectedFormSources"
        label={t("wizard.terms.sources")}
        fieldId="sources"
        renderInput={({
          field: { onChange, onBlur, value },
          fieldState: { isDirty, error },
        }) => (
          <Select
            id="formSources-id"
            maxHeight={DEFAULT_SELECT_MAX_HEIGHT}
            toggleId="sources-toggle"
            variant={SelectVariant.typeaheadMulti}
            aria-label="Select sources"
            selections={value.map((val) => getParsedLabel(val).labelValue)}
            isOpen={isSelectSourcesOpen}
            onSelect={(_, selection) => {
              const selectionWithLabelSelector = `konveyor.io/source=${selection}`;
              if (!value.includes(selectionWithLabelSelector)) {
                onChange([...selectedFormSources, selectionWithLabelSelector]);
              } else {
                onChange(
                  selectedFormSources.filter(
                    (source: string) => source !== selectionWithLabelSelector
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
            validated={getValidatedFromErrors(error, isDirty)}
          >
            {formSources.map((source, index) => (
              <SelectOption
                key={index}
                component="button"
                value={getParsedLabel(source).labelValue}
              />
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
