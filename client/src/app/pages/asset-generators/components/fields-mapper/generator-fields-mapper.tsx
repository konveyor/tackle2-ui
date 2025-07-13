/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect } from "react";
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
}: {
  index: number;
  onRemove: () => void;
}) => {
  const { control } = useFormContext();

  return (
    <RemovableField hideRemoveButton={index === 0} onRemove={onRemove}>
      <Grid hasGutter>
        <GridItem span={6}>
          <InputField
            control={control}
            name={`parameters.${index}.key`}
            label="Key"
            fieldId={`parameter-key-${index}`}
            isRequired
            data-testid={`parameter-key-${index}`}
          />
        </GridItem>
        <GridItem span={6}>
          <InputField
            control={control}
            name={`parameters.${index}.value`}
            label="Value"
            fieldId={`parameter-value-${index}`}
            isRequired
            data-testid={`parameter-value-${index}`}
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
}: {
  collection: Record<string, any>;
}) => {
  const { control } = useFormContext();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "parameters",
  });

  // Initialize fields only once when component mounts
  useEffect(() => {
    if (fields.length === 0) {
      if (collection && Object.keys(collection).length > 0) {
        const arrayData = collectionToArray(collection);
        arrayData.forEach((item) => {
          append(item);
        });
      } else {
        // Add one empty field if no data
        append({ key: "", value: "" });
      }
    }
  }, []);

  const handleAddParameter = () => {
    append({ key: "", value: "" });
  };

  return (
    <Grid className="mac-ip-mapping">
      <Grid hasGutter>
        <GridItem span={6}>
          {fields.map((field, index) => (
            <KeyValueFieldItem
              key={field.id}
              index={index}
              onRemove={() => remove(index)}
            />
          ))}
        </GridItem>
        <GridItem>
          <AddMapping onAdd={handleAddParameter} />
        </GridItem>
      </Grid>
    </Grid>
  );
};
