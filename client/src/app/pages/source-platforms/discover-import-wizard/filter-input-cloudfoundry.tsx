import * as React from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { Control, useFieldArray, useForm } from "react-hook-form";
import * as yup from "yup";
import {
  Bullseye,
  Button,
  FormFieldGroup,
  FormFieldGroupHeader,
  Grid,
  GridItem,
  Stack,
  StackItem,
  Tooltip,
} from "@patternfly/react-core";
import { MinusCircleIcon } from "@patternfly/react-icons/dist/js/icons/minus-circle-icon";
import { PlusCircleIcon } from "@patternfly/react-icons/dist/js/icons/plus-circle-icon";
import styles from "@patternfly/react-styles/css/components/Form/form";

import { JsonDocument } from "@app/api/models";
import { EmptyTextMessage } from "@app/components/EmptyTextMessage";
import { HookFormPFTextInput } from "@app/components/HookFormPFFields";

const AddButton = ({
  label,
  tooltip,
  onAdd,
}: {
  label: string;
  tooltip?: string;
  onAdd: () => void;
}) => {
  return (
    <Bullseye>
      <Tooltip content={<span>{tooltip ?? label}</span>}>
        <Button variant="link" icon={<PlusCircleIcon />} onClick={onAdd}>
          {label}
        </Button>
      </Tooltip>
    </Bullseye>
  );
};

const RemoveButton = ({
  label,
  tooltip,
  onRemove,
}: {
  label?: string;
  tooltip: string;
  onRemove: () => void;
}) => {
  return (
    <Bullseye>
      <Tooltip content={<span>{tooltip ?? label}</span>}>
        <Button variant="plain" icon={<MinusCircleIcon />} onClick={onRemove}>
          {label}
        </Button>
      </Tooltip>
    </Bullseye>
  );
};

/*
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "properties": {
    "names": {
      "description": "Application names. Each may be a glob expression.",
      "items": {
        "minLength": 1,
        "type": "string"
      },
      "minItems": 0,
      "type": "array"
    },
    "spaces": {
      "description": "Space names.",
      "items": {
        "minLength": 1,
        "type": "string"
      },
      "minItems": 1,
      "type": "array"
    }
  },
  "required": ["spaces"],
  "title": "CloudFoundry Discover Filter",
  "type": "object"
}
*/

interface FormValues {
  names: { value: string }[];
  spaces: { value: string }[];
}

const stringsToFormValue = (values?: string[]) =>
  values?.map((value) => ({ value })) ?? [];

const formValueToStrings = (values?: { value: string }[]) =>
  values?.map((value) => value.value) ?? [];

export interface FilterInputCloudFoundryProps {
  id: string;
  values?: JsonDocument;
  onDocumentChanged: (newJsonDocument: JsonDocument) => void;
}

/**
 * Inputs for CloudFoundry discover applications filter.  This is based on the json schema.
 */
export const FilterInputCloudFoundry: React.FC<
  FilterInputCloudFoundryProps
> = ({ id, values, onDocumentChanged }) => {
  const validationSchema = yup.object().shape({
    names: yup
      .array()
      .of(
        yup.object().shape({
          value: yup
            .string()
            .min(1, "Name must be at least 1 character")
            .trim(),
        })
      )
      .min(0),
    spaces: yup
      .array()
      .of(
        yup.object().shape({
          value: yup
            .string()
            .min(1, "Space must be at least 1 character")
            .trim(),
        })
      )
      .min(1),
  });

  const form = useForm<FormValues>({
    defaultValues: {
      names: stringsToFormValue(values?.names as string[]),
      spaces: stringsToFormValue(values?.spaces as string[]),
    },
    resolver: yupResolver(validationSchema),
    mode: "all",
  });

  const { control, subscribe } = form;

  React.useEffect(() => {
    const subscription = subscribe({
      formState: { values: true },
      callback: ({ values }) => {
        const asDocument = {
          names: formValueToStrings(values.names),
          spaces: formValueToStrings(values.spaces),
        };
        console.log("subscription document", asDocument);
        onDocumentChanged(asDocument);
      },
    });
    return () => subscription();
  }, [subscribe, onDocumentChanged]);

  // useFormUpdateHandler(form, onDocumentChanged);

  // // Initialize from values prop
  // useEffect(() => {
  //   reset({
  //     names: (values?.names as string[]) || [],
  //     spaces: (values?.spaces as string[]) || [],
  //   });
  // }, [values, reset]);

  return (
    <Stack id={id}>
      <StackItem>
        <StringFieldsGroup
          control={form.control}
          groupTitle="Names"
          groupDescription="Enter application name (glob expressions allowed)"
          fieldName="names"
          addLabel="Add a name"
          removeLabel="Remove this name"
          emptyMessage="No application names specified"
        />
      </StackItem>

      <StackItem>
        <StringFieldsGroup
          control={form.control}
          groupTitle="Spaces"
          groupDescription="Enter space name"
          fieldName="spaces"
          addLabel="Add a space"
          removeLabel="Remove this space"
          emptyMessage="No spaces specified (at least one space is required)"
          isRequired={true}
        />
      </StackItem>
    </Stack>
  );
};

interface StringFieldsProps {
  control: Control<FormValues>;
  fieldName: keyof FormValues;
  groupTitle: string;
  groupDescription?: string;
  addLabel: string;
  removeLabel: string;
  emptyMessage?: string;
  isRequired?: boolean;
}

const StringFieldsGroup: React.FC<StringFieldsProps> = ({
  control,
  fieldName,
  groupTitle,
  groupDescription,
  addLabel,
  removeLabel,
  emptyMessage,
  isRequired = false,
}) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: fieldName,
  });

  const handleAddField = () => {
    append({ value: "" });
  };

  const handleRemoveField = (index: number) => {
    remove(index);
  };

  return (
    <FormFieldGroup
      header={
        <FormFieldGroupHeader
          titleText={{
            text: (
              <>
                {groupTitle}
                {isRequired && (
                  <span className={styles.formLabelRequired}> *</span>
                )}
              </>
            ),
            id: `${fieldName}-header`,
          }}
          titleDescription={groupDescription}
          actions={<AddButton label={addLabel} onAdd={handleAddField} />}
        />
      }
    >
      <Grid hasGutter>
        {fields.length === 0 && (
          <GridItem span={12}>
            <EmptyTextMessage message={emptyMessage} />
          </GridItem>
        )}
        {fields.map((field, index) => (
          <React.Fragment key={`${fieldName}-${index}`}>
            <GridItem span={11}>
              <HookFormPFTextInput
                control={control}
                name={`${fieldName}.${index}.value`}
                fieldId={`${fieldName}-${field.id}`}
                isRequired={isRequired}
              />
            </GridItem>
            <GridItem span={1}>
              <RemoveButton
                tooltip={removeLabel}
                onRemove={() => handleRemoveField(index)}
              />
            </GridItem>
          </React.Fragment>
        ))}
      </Grid>
    </FormFieldGroup>
  );
};
