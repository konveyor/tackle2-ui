import * as React from "react";
import {
  Button,
  Checkbox,
  Form,
  InputGroup,
  InputGroupText,
  Select,
  SelectOption,
  SelectVariant,
  Text,
  TextContent,
  TextInput,
  Title,
} from "@patternfly/react-core";
import { useForm, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import * as yup from "yup";

import { getValidatedFromErrorTouched } from "@app/utils/utils";
import { defaultSources, defaultTargets } from "./targets";
import DelIcon from "@patternfly/react-icons/dist/esm/icons/error-circle-o-icon";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import { yupResolver } from "@hookform/resolvers/yup";
import { AnalysisWizardFormValues } from "./schema";
import { HookFormPFGroupController } from "@app/shared/components/hook-form-pf-fields";

export const SetOptions: React.FC = () => {
  const { t } = useTranslation();

  const { watch, control, setValue } =
    useFormContext<AnalysisWizardFormValues>();

  const { sources, diva, excludedRulesTags } = watch();

  const excludeRuleForm = useForm({
    defaultValues: { ruleTagToExclude: "" },
    resolver: yupResolver(
      yup.object({
        ruleTagToExclude: yup
          .string()
          .matches(/^(|.{2,})$/, t("validation.minLength", { length: 2 })) // Either 0 or 2+ characters
          .max(60, t("validation.maxLength", { length: 60 })),
      })
    ),
    mode: "onChange",
  });

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

      <HookFormPFGroupController
        control={excludeRuleForm.control}
        name="ruleTagToExclude"
        fieldId="ruleTagToExclude"
        className={`${spacing.mtMd} ${spacing.plLg}`}
        renderInput={({
          field: { name, onChange, onBlur, value, ref },
          fieldState: { isTouched, error },
        }) => (
          <InputGroup>
            <TextInput
              ref={ref}
              id="ruleTagToExclude"
              aria-label="Rule tag to exclude" // TODO translation here
              validated={getValidatedFromErrorTouched(error, isTouched)}
              value={value}
              onChange={onChange}
              onBlur={onBlur}
            />
            <Button
              id="add-rule-tag-to-exclude"
              variant="control"
              isDisabled={!value || !!error}
              onClick={() => {
                setValue("excludedRulesTags", [...excludedRulesTags, value]);
                excludeRuleForm.resetField(name);
              }}
            >
              {t("terms.add")}
            </Button>
          </InputGroup>
        )}
      />
      {excludedRulesTags.length > 0 && (
        <div className={spacing.plLg}>
          {excludedRulesTags.map(
            (tag, index) =>
              tag && (
                <InputGroup key={index}>
                  <InputGroupText className="package">{tag}</InputGroupText>
                  <Button
                    isInline
                    id={`remove-${tag}-from-excluded-tags`}
                    variant="control"
                    icon={<DelIcon />}
                    onClick={() =>
                      setValue(
                        "excludedRulesTags",
                        excludedRulesTags.filter((t) => t !== tag)
                      )
                    }
                  />
                </InputGroup>
              )
          )}
        </div>
      )}

      <div className={spacing.pMd}>
        {excludedRulesTags.map((pkg, index) => (
          <div key={index}>
            <InputGroup key={index}>
              <InputGroupText className="package">{pkg}</InputGroupText>
              <Button
                isInline
                id="remove-from-excluded-rules-tags"
                variant="control"
                icon={<DelIcon />}
                onClick={() =>
                  setValue(
                    "excludedRulesTags",
                    excludedRulesTags.filter((p) => p !== pkg)
                  )
                }
              />
            </InputGroup>
          </div>
        ))}
      </div>
      <Checkbox
        className={spacing.mtMd}
        label={t("wizard.composed.enable", {
          what: t("wizard.terms.transactionReport").toLowerCase(),
        })}
        isChecked={diva}
        onChange={() => setValue("diva", !diva)}
        id="controlled-check-4"
        name="enableTransactionReport"
      />
    </Form>
  );
};
