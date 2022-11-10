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
import { defaultSources, defaultTargets } from "./targets";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import { AnalysisWizardFormValues } from "./schema";
import { HookFormPFGroupController } from "@app/shared/components/hook-form-pf-fields";
import { StringListField } from "@app/shared/components/string-list-field";

export const SetOptions: React.FC = () => {
  const { t } = useTranslation();

  const { watch, control, setValue } =
    useFormContext<AnalysisWizardFormValues>();

  const { sources, diva, excludedRulesTags } = watch();

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
        name="targets"
        label={t("wizard.terms.targets")}
        fieldId="targets"
        isRequired
        renderInput={({
          field: { onChange, onBlur, value },
          fieldState: { isTouched, error },
        }) => (
          <Select
            id="targets"
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
        name="sources"
        label={t("wizard.terms.sources")}
        fieldId="sources"
        renderInput={({
          field: { onChange, onBlur, value },
          fieldState: { isTouched, error },
        }) => (
          <Select
            id="sources"
            variant={SelectVariant.typeaheadMulti}
            aria-label="Select sources"
            selections={value}
            isOpen={isSelectSourcesOpen}
            onSelect={(_, selection) => {
              if (!value.includes(selection as string)) {
                onChange([...sources, selection] as string[]);
              } else {
                onChange(sources.filter((source) => source !== selection));
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
    </Form>
  );
};
