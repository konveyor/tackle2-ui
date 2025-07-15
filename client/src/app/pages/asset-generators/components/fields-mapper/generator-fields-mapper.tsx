/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from "react";
import { GridItem, Grid, Button } from "@patternfly/react-core";
import { useFieldArray, useFormContext } from "react-hook-form";
import { PlusCircleIcon } from "@patternfly/react-icons/dist/js/icons/plus-circle-icon";
import { HookFormPFTextInput as InputField } from "@app/components/HookFormPFFields";
import RemovableField from "./RemovableField";

interface KeyValuePair {
  key: string;
  value: string;
}

const AddMapping: React.FC<{
  onAdd: () => void;
}> = ({ onAdd }) => {
  return (
    <Button
      icon={<PlusCircleIcon />}
      isInline
      id="add-generator-parameter"
      onClick={onAdd}
      data-testid="add-generator-parameter"
      variant="link"
    >
      Add Parameter
    </Button>
  );
};

const KeyValueFieldItem = ({
  index,
  onRemove,
  name,
}: {
  index: number;
  onRemove: () => void;
  name: string;
}) => {
  const { control } = useFormContext();

  return (
    <RemovableField hideRemoveButton={index === 0} onRemove={onRemove}>
      <Grid hasGutter>
        <GridItem span={6}>
          <InputField
            control={control}
            name={`${name}.${index}.key`}
            label="Key"
            fieldId={`${name}-key-${index}`}
            isRequired
            data-testid={`${name}-key-${index}`}
          />
        </GridItem>
        <GridItem span={6}>
          <InputField
            control={control}
            name={`${name}.${index}.value`}
            label="Value"
            fieldId={`${name}-value-${index}`}
            isRequired
            data-testid={`${name}-value-${index}`}
          />
        </GridItem>
      </Grid>
    </RemovableField>
  );
};

export const getFormikArrayItemFieldName = (
  arrayFieldName: string,
  idx: number
) => {
  return `${arrayFieldName}[${idx}]`;
};

// Helper function to convert collection to array format
const collectionToArray = (collection: Record<string, any>): KeyValuePair[] => {
  if (!collection || Object.keys(collection).length === 0) return [];
  return Object.entries(collection).map(([key, value]) => ({
    key,
    value: String(value),
  }));
};

export const KeyValueFields = ({
  collection,
  name,
}: {
  collection: Record<string, any>;
  name: string;
}) => {
  const { control } = useFormContext();
  const [hasInitialized, setHasInitialized] = useState(false);

  const { fields, append, insert, remove } = useFieldArray({
    control,
    name,
  });

  // Initialize fields when collection changes
  useEffect(() => {
    if (!hasInitialized) {
      if (collection && Object.keys(collection).length > 0) {
        const keyValuePairs = Object.entries(collection).map(
          ([key, value]) => ({ key, value: String(value) })
        );
        append(keyValuePairs);
      } else {
        append({ key: "", value: "" });
      }
      setHasInitialized(true);
    }
  }, [append, collection, hasInitialized]);

  const handleAddField = () => {
    append({ key: "", value: "" });
  };

  return (
    <Grid className="generator-field-mapping">
      <Grid hasGutter>
        <GridItem span={6}>
          {fields.map((field, index) => (
            <KeyValueFieldItem
              key={`${name}-${field.id}`}
              index={index}
              onRemove={() => remove(index)}
              name={name}
            />
          ))}
        </GridItem>
        <GridItem>
          <AddMapping onAdd={handleAddField} />
        </GridItem>
      </Grid>
    </Grid>
  );
};
