import * as React from "react";
import {
  Button,
  Checkbox,
  Form,
  FormGroup,
  InputGroup,
  Select,
  SelectOption,
  SelectVariant,
  Text,
  TextContent,
  TextInput,
  Title,
} from "@patternfly/react-core";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";

import {
  getValidatedFromError,
  getValidatedFromErrorTouched,
} from "@app/utils/utils";
import { defaultSources, defaultTargets } from "./targets";
import DelIcon from "@patternfly/react-icons/dist/esm/icons/error-circle-o-icon";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

export const SetOptions: React.FC = () => {
  const { t } = useTranslation();

  const { getValues, setValue, setError, control, trigger, resetField } =
    useFormContext();

  const targets: string[] = getValues("targets");
  const sources: string[] = getValues("sources");
  const diva: boolean = getValues("diva");
  const excludedRulesTags: string[] = getValues("excludedRulesTags");

  const [isSelectTargetsOpen, setSelectTargetsOpen] = React.useState(false);
  const [isSelectSourcesOpen, setSelectSourcesOpen] = React.useState(false);
  return (
    <>
      <TextContent>
        <Title headingLevel="h3" size="xl">
          {t("wizard.title.advancedOptions")}
        </Title>
        <Text>{t("wizard.label.advancedOptions")}</Text>
      </TextContent>
      <Form isHorizontal>
        <FormGroup label={t("wizard.terms.targets")} fieldId="targets">
          <Select
            variant={SelectVariant.typeaheadMulti}
            aria-label="Select targets"
            selections={targets}
            isOpen={isSelectTargetsOpen}
            onSelect={(_, selection) => {
              if (!targets.includes(selection as string))
                setValue("targets", [...targets, selection] as string[]);
              else
                setValue(
                  "targets",
                  targets.filter((target) => target !== selection)
                );
              setSelectTargetsOpen(!isSelectTargetsOpen);
            }}
            onToggle={() => {
              setSelectTargetsOpen(!isSelectTargetsOpen);
            }}
            onClear={() => {
              setValue("targets", []);
            }}
          >
            {defaultTargets.map((target, index) => (
              <SelectOption key={index} component="button" value={target} />
            ))}
          </Select>
        </FormGroup>
        <FormGroup label={t("wizard.terms.sources")} fieldId="sources">
          <Select
            variant={SelectVariant.typeaheadMulti}
            aria-label="Select sources"
            selections={sources}
            isOpen={isSelectSourcesOpen}
            onSelect={(_, selection) => {
              if (!sources.includes(selection as string))
                setValue("sources", [...sources, selection] as string[]);
              else
                setValue(
                  "sources",
                  sources.filter((source) => source !== selection)
                );
              setSelectSourcesOpen(!isSelectSourcesOpen);
            }}
            onToggle={() => {
              setSelectSourcesOpen(!isSelectSourcesOpen);
            }}
            onClear={() => {
              setValue("sources", []);
            }}
          >
            {defaultSources.map((source, index) => (
              <SelectOption key={index} component="button" value={source} />
            ))}
          </Select>
        </FormGroup>
        <Controller
          control={control}
          name="ruleTagToExclude"
          render={({
            field: { onBlur, onChange, value, name, ref },
            fieldState: { isTouched, error, isDirty },
          }) => {
            return (
              <FormGroup
                label={t("wizard.composed.excluded", {
                  what: t("wizard.terms.rulesTags"),
                })}
                fieldId="ruleTagToExclude"
                validated={getValidatedFromError(error?.message)}
                helperTextInvalid={error?.message}
              >
                <InputGroup>
                  <TextInput
                    name={name}
                    id={name}
                    aria-label="Rule tag to exclude"
                    onChange={(val, e) => {
                      trigger(name);
                      onChange(val, e);
                    }}
                    validated={getValidatedFromError(error?.message)}
                    value={value}
                    onBlur={onBlur}
                    ref={ref}
                  />
                  <Button
                    id="add-rule-tag"
                    variant="control"
                    isDisabled={!!error || !isDirty}
                    onClick={() => {
                      setValue("excludedRulesTags", [
                        ...excludedRulesTags,
                        value,
                      ]);
                      resetField(name);
                    }}
                  >
                    {t("terms.add")}
                  </Button>
                </InputGroup>
              </FormGroup>
            );
          }}
        />

        <div className={spacing.pMd}>
          {excludedRulesTags.map((pkg, index) => (
            <div key={index}>
              <InputGroup key={index}>
                <Text className="package">{pkg}</Text>
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
      </Form>
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
    </>
  );
};
