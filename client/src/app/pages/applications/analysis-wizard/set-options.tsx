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
import { HookFormPFGroupController } from "@app/components/HookFormPFFields";
import { StringListField } from "@app/components/StringListField";
import { getParsedLabel } from "@app/utils/rules-utils";
import { DEFAULT_SELECT_MAX_HEIGHT } from "@app/Constants";
import { useFetchTargets } from "@app/queries/targets";
import defaultSources from "./sources";
import { Target } from "@app/api/models";

export const SetOptions: React.FC = () => {
  const { t } = useTranslation();

  const { watch, control, setValue, getValues } =
    useFormContext<AnalysisWizardFormValues>();

  const { formLabels, diva, excludedRulesTags, autoTaggingEnabled } = watch();

  const [isSelectTargetsOpen, setSelectTargetsOpen] = React.useState(false);
  const [isSelectSourcesOpen, setSelectSourcesOpen] = React.useState(false);
  const { targets } = useFetchTargets();

  const allLabelsFromTargets = targets
    .map((target) => target?.labels ?? [])
    .filter(Boolean)
    .flat()
    // Remove duplicates from array of objects based on label value (label.label)
    .filter((v, i, a) => a.findIndex((v2) => v2.label === v.label) === i);

  const allTargetLabelsFromTargets = allLabelsFromTargets.filter((label) => {
    const parsedLabel = getParsedLabel(label?.label);
    if (parsedLabel.labelType === "target") {
      return parsedLabel.labelValue;
    }
  });

  const allSourceLabelsFromTargets = allLabelsFromTargets.filter((label) => {
    const parsedLabel = getParsedLabel(label?.label);
    if (parsedLabel.labelType === "source") {
      return parsedLabel.labelValue;
    }
  });

  const defaultTargetsAndTargetsLabels = [
    ...new Set(defaultTargets.concat(allTargetLabelsFromTargets)),
  ];

  const defaultSourcesAndSourcesLabels = [
    ...new Set(defaultSources.concat(allSourceLabelsFromTargets)),
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
        name="formLabels"
        label={t("wizard.terms.targets")}
        fieldId="target-labels"
        renderInput={({
          field: { onChange, onBlur },
          fieldState: { isDirty, error },
        }) => {
          const targetSelections = formLabels
            .map((formLabel) => {
              const parsedLabel = getParsedLabel(formLabel?.label);
              if (parsedLabel.labelType === "target") {
                return parsedLabel.labelValue;
              }
            })
            .filter(Boolean);
          return (
            <Select
              id="targets"
              toggleId="targets-toggle"
              variant={SelectVariant.typeaheadMulti}
              maxHeight={DEFAULT_SELECT_MAX_HEIGHT}
              aria-label="Select targets"
              selections={targetSelections}
              isOpen={isSelectTargetsOpen}
              onSelect={(_, selection) => {
                const selectionWithLabelSelector = `konveyor.io/target=${selection}`;
                const matchingLabel =
                  defaultTargetsAndTargetsLabels?.find(
                    (label) => label.label === selectionWithLabelSelector
                  ) || "";

                const formLabelLabels = formLabels.map(
                  (formLabel) => formLabel.label
                );
                if (
                  matchingLabel &&
                  !formLabelLabels.includes(matchingLabel.label)
                ) {
                  onChange([...formLabels, matchingLabel]);
                } else {
                  onChange(
                    formLabels.filter(
                      (formLabel) =>
                        formLabel.label !== selectionWithLabelSelector
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
              validated={getValidatedFromErrors(error, isDirty)}
            >
              {defaultTargetsAndTargetsLabels.map((targetLabel, index) => (
                <SelectOption
                  key={index}
                  component="button"
                  value={getParsedLabel(targetLabel.label).labelValue}
                />
              ))}
            </Select>
          );
        }}
      />
      <HookFormPFGroupController
        control={control}
        name="formLabels"
        label={t("wizard.terms.sources")}
        fieldId="sources"
        renderInput={({
          field: { onChange, onBlur, value },
          fieldState: { isDirty, error },
        }) => {
          const sourceSelections = formLabels
            .map((formLabel) => {
              const parsedLabel = getParsedLabel(formLabel?.label);
              if (parsedLabel.labelType === "source") {
                return parsedLabel.labelValue;
              }
            })
            .filter(Boolean);

          return (
            <Select
              id="formSources-id"
              maxHeight={DEFAULT_SELECT_MAX_HEIGHT}
              toggleId="sources-toggle"
              variant={SelectVariant.typeaheadMulti}
              aria-label="Select sources"
              selections={sourceSelections}
              isOpen={isSelectSourcesOpen}
              onSelect={(_, selection) => {
                const selectionWithLabelSelector = `konveyor.io/source=${selection}`;
                const matchingLabel =
                  defaultSourcesAndSourcesLabels?.find(
                    (label) => label.label === selectionWithLabelSelector
                  ) || "";

                const formLabelLabels = formLabels.map(
                  (formLabel) => formLabel.label
                );
                if (
                  matchingLabel &&
                  !formLabelLabels.includes(matchingLabel.label)
                ) {
                  onChange([...formLabels, matchingLabel]);
                } else {
                  onChange(
                    formLabels.filter(
                      (formLabel) =>
                        formLabel.label !== selectionWithLabelSelector
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
              {defaultSourcesAndSourcesLabels.map((targetLabel, index) => (
                <SelectOption
                  key={index}
                  component="button"
                  value={getParsedLabel(targetLabel.label).labelValue}
                />
              ))}
            </Select>
          );
        }}
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
