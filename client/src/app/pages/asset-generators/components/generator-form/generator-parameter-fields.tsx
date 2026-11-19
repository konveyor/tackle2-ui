import { Fragment, forwardRef, useImperativeHandle } from "react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  Bullseye,
  Button,
  FormSelect,
  FormSelectOption,
  Grid,
  GridItem,
  Tooltip,
} from "@patternfly/react-core";
import { MinusCircleIcon } from "@patternfly/react-icons";

import { EmptyTextMessage } from "@app/components/EmptyTextMessage";
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
  const { clearErrors, control, getValues, setValue } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name });
  // useWatch reads the stored values and re-renders when they change, so the
  // default field can become the true/false select.
  const rows = useWatch({ control, name }) as GeneratorParameter[] | undefined;

  const handleAddField = () =>
    append({ name: "", type: "string", default: "" });

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
                  <FormSelect
                    id={`${name}-type-${index}`}
                    value={value}
                    onChange={(_e, selection) => {
                      onChange(selection);
                      // Re-validate the default against the new type — the form
                      // only re-validates the field that changed, so a stale
                      // default would otherwise go unnoticed until submit.
                      // Switching to boolean also clears a value the select
                      // cannot hold.
                      const defaultPath = `${name}.${index}.default`;
                      const current = getValues(defaultPath);
                      const isBooleanValue =
                        current === "true" || current === "false";
                      const nextDefault =
                        selection === "boolean" && !isBooleanValue
                          ? ""
                          : current;

                      if (nextDefault === "") {
                        // Don't validate a blank default: the default has not
                        // been filled in yet.
                        if (current !== "") {
                          setValue(defaultPath, "");
                          clearErrors(defaultPath);
                        }
                        return;
                      }
                      void setValue(defaultPath, nextDefault, {
                        shouldTouch: true,
                        shouldValidate: true,
                      });
                    }}
                  >
                    {PARAMETER_TYPES.map((pt) => (
                      <FormSelectOption
                        key={pt}
                        value={pt}
                        label={t(`parameterType.${pt}`)}
                      />
                    ))}
                  </FormSelect>
                )}
              />
            </GridItem>
            <GridItem span={4}>
              {rows?.[index]?.type === "boolean" ? (
                <HookFormPFGroupController
                  control={control}
                  name={`${name}.${index}.default`}
                  label={t("terms.value")}
                  fieldId={`${name}-value-${index}`}
                  isRequired
                  renderInput={({ field: { value, onChange } }) => (
                    <FormSelect
                      id={`${name}-value-${index}`}
                      value={value}
                      aria-label={t("terms.value")}
                      onChange={(_e, selection) => onChange(selection)}
                    >
                      <FormSelectOption
                        value=""
                        label={t("composed.selectOne", {
                          what: t("terms.value").toLowerCase(),
                        })}
                        isDisabled
                        hidden
                        isPlaceholder
                      />
                      <FormSelectOption
                        value="true"
                        label={t("generatorParameters.true")}
                      />
                      <FormSelectOption
                        value="false"
                        label={t("generatorParameters.false")}
                      />
                    </FormSelect>
                  )}
                />
              ) : (
                <InputField
                  control={control}
                  name={`${name}.${index}.default`}
                  label={t("terms.value")}
                  fieldId={`${name}-value-${index}`}
                  isRequired
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
          </Fragment>
        ))}
      </Grid>
    </Grid>
  );
});

ParameterFields.displayName = "ParameterFields";
