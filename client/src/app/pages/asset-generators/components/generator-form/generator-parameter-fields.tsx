import { Fragment, forwardRef, useImperativeHandle } from "react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  Bullseye,
  Button,
  Grid,
  GridItem,
  Tooltip,
} from "@patternfly/react-core";
import { MinusCircleIcon } from "@patternfly/react-icons";

import { EmptyTextMessage } from "@app/components/EmptyTextMessage";
import { FilterSelectOptionProps } from "@app/components/FilterToolbar/FilterToolbar";
import SimpleSelect from "@app/components/FilterToolbar/components/SimpleSelect";
import {
  HookFormPFGroupController,
  HookFormPFTextInput as InputField,
} from "@app/components/HookFormPFFields";

import { type GeneratorParameter, PARAMETER_TYPES } from "../../utils";

interface ParameterFieldsProps {
  noParametersMessage: string;
  removeLabel: string;
  name: string;
}

export const ParameterFields = forwardRef<
  { addField: () => void },
  ParameterFieldsProps
>(({ noParametersMessage, removeLabel, name }, ref) => {
  const { t } = useTranslation();
  const { control, getValues, setValue } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name });
  // useWatch reads the stored values and re-renders when they change, so the
  // default field can become the true/false select.
  const rows = useWatch({ control, name }) as GeneratorParameter[] | undefined;

  const handleAddField = () =>
    append({ name: "", type: "string", default: "", description: "" });

  useImperativeHandle(ref, () => ({
    addField: handleAddField,
  }));

  return (
    <Grid className="generator-parameter-fields">
      <Grid hasGutter>
        {fields.length === 0 && (
          <GridItem span={12}>
            <EmptyTextMessage message={noParametersMessage} />
          </GridItem>
        )}
        {fields.map((field, index) => (
          <Fragment key={`${name}-${field.id}`}>
            <GridItem span={4}>
              <InputField
                control={control}
                name={`${name}.${index}.name`}
                label={t("terms.name")}
                fieldId={`${name}-name-${index}`}
                isRequired
              />
            </GridItem>
            <GridItem span={3}>
              <HookFormPFGroupController
                control={control}
                name={`${name}.${index}.type`}
                label={t("terms.type")}
                fieldId={`${name}-type-${index}`}
                isRequired
                renderInput={({ field: { value, onChange } }) => (
                  <SimpleSelect
                    toggleId={`${name}-type-${index}`}
                    toggleAriaLabel={t("terms.type")}
                    value={value}
                    options={PARAMETER_TYPES.map(
                      (pt): FilterSelectOptionProps => ({
                        value: pt,
                        label: t(`parameterType.${pt}`),
                      })
                    )}
                    onSelect={(selection) => {
                      onChange(selection);
                      // Re-validate the default against the new type — the form
                      // only re-validates the field that changed, so a stale
                      // default would otherwise go unnoticed until submit.
                      // Switching to boolean also clears a value the select
                      // cannot hold; a blank default is valid.
                      const defaultPath = `${name}.${index}.default`;
                      const current = getValues(defaultPath);
                      const isBooleanValue =
                        current === "true" || current === "false";
                      const nextDefault =
                        selection === "boolean" && !isBooleanValue
                          ? ""
                          : current;
                      void setValue(defaultPath, nextDefault, {
                        shouldTouch: true,
                        shouldValidate: true,
                      });
                    }}
                  />
                )}
              />
            </GridItem>
            <GridItem span={4}>
              {rows?.[index]?.type === "boolean" ? (
                <HookFormPFGroupController
                  control={control}
                  name={`${name}.${index}.default`}
                  label={t("terms.defaultValue")}
                  fieldId={`${name}-value-${index}`}
                  renderInput={({ field: { value, onChange } }) => (
                    <SimpleSelect
                      toggleId={`${name}-value-${index}`}
                      toggleAriaLabel={t("terms.defaultValue")}
                      value={value}
                      options={[
                        { value: "true", label: t("generatorParameters.true") },
                        {
                          value: "false",
                          label: t("generatorParameters.false"),
                        },
                      ]}
                      placeholderText={t("composed.selectOne", {
                        what: t("terms.defaultValue").toLowerCase(),
                      })}
                      onSelect={(selection) => onChange(selection)}
                    />
                  )}
                />
              ) : (
                <InputField
                  control={control}
                  name={`${name}.${index}.default`}
                  label={t("terms.defaultValue")}
                  fieldId={`${name}-value-${index}`}
                />
              )}
            </GridItem>
            <GridItem span={1}>
              <Bullseye>
                <Tooltip content={<span>{removeLabel}</span>}>
                  <Button
                    variant="plain"
                    icon={<MinusCircleIcon />}
                    aria-label={removeLabel}
                    onClick={() => remove(index)}
                  />
                </Tooltip>
              </Bullseye>
            </GridItem>
            <GridItem span={11}>
              <InputField
                control={control}
                name={`${name}.${index}.description`}
                label={t("terms.description")}
                fieldId={`${name}-description-${index}`}
              />
            </GridItem>
            <GridItem span={1} />
          </Fragment>
        ))}
      </Grid>
    </Grid>
  );
});

ParameterFields.displayName = "ParameterFields";
