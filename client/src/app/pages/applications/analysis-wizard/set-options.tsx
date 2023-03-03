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
import defaultSources from "./sources";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import { AnalysisWizardFormValues } from "./schema";
import { HookFormPFGroupController } from "@app/shared/components/hook-form-pf-fields";
import { StringListField } from "@app/shared/components/string-list-field";
import { defaultTargets } from "@app/data/targets";

export const SetOptions: React.FC = () => {
  const { t } = useTranslation();

  const { watch, control, setValue } =
    useFormContext<AnalysisWizardFormValues>();

  const {
    formSources,
    formTargets,
    diva,
    excludedRulesTags,
    autoTaggingEnabled,
  } = watch();

  const [isSelectTargetsOpen, setSelectTargetsOpen] = React.useState(false);
  const [isSelectSourcesOpen, setSelectSourcesOpen] = React.useState(false);

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
          field: { onChange, onBlur, value },
          fieldState: { isTouched, error },
        }) => (
          <Select
            id="targets"
            toggleId="targets-toggle"
            variant={SelectVariant.typeaheadMulti}
            aria-label="Select targets"
            selections={value}
            isOpen={isSelectTargetsOpen}
            onSelect={(_, selection) => {
              if (!value.includes(selection as string)) {
                onChange([...value, selection] as string[]);
              } else {
                onChange(value.filter((target) => target !== selection));
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
            {defaultTargets.map((target, index) => (
              <SelectOption key={index} component="button" value={target} />
            ))}
          </Select>
        )}
      />
      <HookFormPFGroupController
        control={control}
        name="formSources"
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
                onChange([...formSources, selection] as string[]);
              } else {
                onChange(
                  formSources.filter((source: string) => source !== selection)
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
            {defaultSources.map((source, index) => (
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
