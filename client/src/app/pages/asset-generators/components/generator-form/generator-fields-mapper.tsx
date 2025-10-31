import React from "react";
import {
  GridItem,
  Grid,
  Button,
  Bullseye,
  Tooltip,
} from "@patternfly/react-core";
import { useFieldArray, useFormContext } from "react-hook-form";
import { HookFormPFTextInput as InputField } from "@app/components/HookFormPFFields";
import { MinusCircleIcon } from "@patternfly/react-icons/dist/js/icons/minus-circle-icon";
import { EmptyTextMessage } from "@app/components/EmptyTextMessage";

interface KeyValueFieldsProps {
  noValuesMessage: string;
  removeLabel: string;
  name: string;
}

export const KeyValueFields = React.forwardRef<
  { addField: () => void },
  KeyValueFieldsProps
>(({ noValuesMessage, removeLabel, name }, ref) => {
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name,
  });

  const handleRemoveField = (index: number) => {
    remove(index);
  };

  const handleAddField = () => {
    append({ key: "", value: "" });
  };

  React.useImperativeHandle(ref, () => ({
    addField: handleAddField,
  }));

  return (
    <Grid className="generator-field-mapping">
      <Grid hasGutter>
        {fields.length === 0 && (
          <GridItem span={12}>
            <EmptyTextMessage message={noValuesMessage} />
          </GridItem>
        )}
        {fields.map((field, index) => (
          <React.Fragment key={`${name}-${field.id}`}>
            <GridItem span={5}>
              <InputField
                control={control}
                name={`${name}.${index}.key`}
                label="Key"
                fieldId={`${name}-key-${index}`}
                isRequired
              />
            </GridItem>
            <GridItem span={6}>
              <InputField
                control={control}
                name={`${name}.${index}.value`}
                label="Value"
                fieldId={`${name}-value-${index}`}
                isRequired
              />
            </GridItem>
            <GridItem span={1}>
              <RemoveButton
                removeLabel={removeLabel}
                onRemove={() => handleRemoveField(index)}
              />
            </GridItem>
          </React.Fragment>
        ))}
      </Grid>
    </Grid>
  );
});

KeyValueFields.displayName = "KeyValueFields";

const RemoveButton = ({
  removeLabel,
  onRemove,
}: {
  removeLabel: string;
  onRemove: () => void;
}) => {
  return (
    <Bullseye>
      <Tooltip content={<span>{removeLabel}</span>}>
        <Button variant="plain" icon={<MinusCircleIcon />} onClick={onRemove} />
      </Tooltip>
    </Bullseye>
  );
};
