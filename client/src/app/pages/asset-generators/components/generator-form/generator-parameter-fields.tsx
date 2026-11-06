import { Fragment, forwardRef, useImperativeHandle } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
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

import { PARAMETER_TYPES } from "../../utils";

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
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name });

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
                    onChange={(_e, selection) => onChange(selection)}
                  >
                    {PARAMETER_TYPES.map((pt) => (
                      <FormSelectOption key={pt} value={pt} label={pt} />
                    ))}
                  </FormSelect>
                )}
              />
            </GridItem>
            <GridItem span={4}>
              <InputField
                control={control}
                name={`${name}.${index}.default`}
                label={t("terms.value")}
                fieldId={`${name}-value-${index}`}
                isRequired
              />
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
