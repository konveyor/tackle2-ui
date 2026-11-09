import * as React from "react";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  Checkbox,
  ExpandableSection,
  FormFieldGroup,
  FormFieldGroupHeader,
} from "@patternfly/react-core";
import styles from "@patternfly/react-styles/css/components/Form/form";

import { JsonSchemaObject } from "@app/api/models";
import {
  HookFormPFGroupController,
  HookFormPFTextInput,
} from "@app/components/HookFormPFFields";

import { jsonSchemaToYupResolver } from "./utils";

/** A collapsible group of top-level properties, e.g. one generator's parameters. */
export interface SchemaFieldSection {
  /** Stable identifier, used as the React key and for the expansion state. */
  id: string;
  /** Text shown in the section toggle. */
  title: string;
  /** Names of the properties (from jsonSchema.properties) shown in the section. */
  propertyKeys: string[];
}

export interface SchemaAsFieldsProps {
  id: string;
  jsonDocument: object;
  jsonSchema: JsonSchemaObject;
  onDocumentChanged?: (newJsonDocument: object) => void;
  isReadOnly?: boolean;
  /**
   * Render the properties inside collapsible sections. Properties not listed in
   * any section are rendered after them, without a section.
   */
  sections?: SchemaFieldSection[];
}

interface FieldProps {
  isReadOnly?: boolean;
  fieldKey: string;
  fieldSchema: JsonSchemaObject;
  path: string;
  required?: boolean;
}

const StringField: React.FC<FieldProps> = ({
  isReadOnly,
  fieldKey,
  fieldSchema,
  path,
  required,
}) => {
  const { control } = useFormContext();
  const fieldId = `field-${path}`;

  return (
    <HookFormPFTextInput
      isDisabled={isReadOnly}
      control={control}
      name={path}
      label={fieldSchema.title || fieldKey}
      helperText={fieldSchema.description}
      fieldId={fieldId}
      isRequired={required}
    />
  );
};

const NumberField: React.FC<FieldProps> = ({
  isReadOnly,
  fieldKey,
  fieldSchema,
  path,
  required,
}) => {
  const { control } = useFormContext();
  const fieldId = `field-${path}`;

  return (
    <HookFormPFTextInput
      isDisabled={isReadOnly}
      control={control}
      name={path}
      label={fieldSchema.title || fieldKey}
      helperText={fieldSchema.description}
      fieldId={fieldId}
      isRequired={required}
      type={fieldSchema.type === "integer" ? "integer" : "number"}
    />
  );
};

const BooleanField: React.FC<FieldProps> = ({
  isReadOnly,
  fieldKey,
  fieldSchema,
  path,
  required,
}) => {
  const {
    control,
    formState: { errors },
  } = useFormContext();
  const fieldId = `field-${path}`;
  const errorMessage = errors[path]?.message as string;
  const isValid = !errorMessage;

  return (
    <HookFormPFGroupController
      control={control}
      name={path}
      label={fieldSchema.title || fieldKey}
      helperText={fieldSchema.description}
      fieldId={fieldId}
      isRequired={required}
      renderInput={({ field: { value, onChange } }) => (
        <Checkbox
          id={fieldId}
          label={fieldSchema.title || fieldKey}
          isDisabled={isReadOnly}
          isChecked={!!value}
          onChange={onChange}
          aria-invalid={!isValid}
          aria-describedby={`${fieldId}-helper`}
        />
      )}
    />
  );
};

const ObjectField: React.FC<FieldProps> = ({
  isReadOnly,
  fieldKey,
  fieldSchema,
  path,
}) => {
  return (
    <FormFieldGroup
      style={{
        gridTemplateColumns: "2rem 1fr",
      }}
      header={
        <FormFieldGroupHeader
          titleText={{
            text: fieldSchema.title || fieldKey,
            id: `field-${path}-title`,
          }}
          titleDescription={fieldSchema.description}
        />
      }
    >
      {Object.keys(fieldSchema.properties || {}).map((nestedKey) => (
        <SchemaField
          isReadOnly={isReadOnly}
          key={nestedKey}
          fieldKey={nestedKey}
          fieldSchema={fieldSchema.properties![nestedKey]}
          path={path ? `${path}.${nestedKey}` : nestedKey}
          parentSchema={fieldSchema}
        />
      ))}
    </FormFieldGroup>
  );
};

interface SchemaFieldProps {
  isReadOnly?: boolean;
  fieldKey: string;
  fieldSchema: JsonSchemaObject;
  path: string;
  parentSchema?: JsonSchemaObject;
}

const SchemaField: React.FC<SchemaFieldProps> = ({
  isReadOnly,
  fieldKey,
  fieldSchema,
  path,
  parentSchema,
}) => {
  const required = parentSchema?.required?.includes(fieldKey) ?? false;

  switch (fieldSchema.type) {
    case "string":
      return (
        <StringField
          isReadOnly={isReadOnly}
          fieldKey={fieldKey}
          fieldSchema={fieldSchema}
          path={path}
          required={required}
        />
      );
    case "number":
    case "integer":
      return (
        <NumberField
          isReadOnly={isReadOnly}
          fieldKey={fieldKey}
          fieldSchema={fieldSchema}
          path={path}
          required={required}
        />
      );
    case "boolean":
      return (
        <BooleanField
          isReadOnly={isReadOnly}
          fieldKey={fieldKey}
          fieldSchema={fieldSchema}
          path={path}
          required={required}
        />
      );
    case "object":
      return (
        <ObjectField
          isReadOnly={isReadOnly}
          fieldKey={fieldKey}
          fieldSchema={fieldSchema}
          path={path}
          required={required}
        />
      );
    default:
      return null; // TODO: type="array" is not supported yet
  }
};

export const SchemaAsFields: React.FC<SchemaAsFieldsProps> = ({
  id,
  jsonDocument,
  jsonSchema,
  onDocumentChanged,
  isReadOnly = false,
  sections,
}) => {
  const { t } = useTranslation();
  const [collapsedSections, setCollapsedSections] = React.useState<
    Record<string, boolean>
  >({});

  const methods = useForm({
    resolver: jsonSchemaToYupResolver(jsonSchema, t),
    defaultValues: jsonDocument,
    mode: "all",
  });

  const { reset, subscribe } = methods;

  // Update form values when jsonDocument prop changes
  React.useEffect(() => {
    reset(jsonDocument);
  }, [jsonDocument, reset]);

  // Call onDocumentChanged when the form values change
  React.useEffect(() => {
    const subscription = subscribe({
      formState: {
        values: true,
      },
      callback: ({ values }) => {
        onDocumentChanged?.(values);
      },
    });
    return () => subscription();
  }, [subscribe, onDocumentChanged]);

  const properties = jsonSchema?.properties ?? {};
  const sectionKeys = new Set(
    (sections ?? []).flatMap((section) => section.propertyKeys)
  );
  const ungroupedProperties = Object.entries(properties).filter(
    ([key]) => !sectionKeys.has(key)
  );

  const renderField = (key: string, fieldSchema: JsonSchemaObject) => (
    <SchemaField
      isReadOnly={isReadOnly}
      key={key}
      fieldKey={key}
      fieldSchema={fieldSchema}
      path={key}
      parentSchema={jsonSchema}
    />
  );

  // A property shared by more than one section is rendered once, in the first
  // section that lists it, to avoid binding two inputs to the same field.
  const renderedKeys = new Set<string>();

  return (
    <FormProvider {...methods}>
      <div id={`${id}-form`} className={styles.form}>
        {(sections ?? []).map((section) => (
          <ExpandableSection
            key={section.id}
            toggleText={section.title}
            isExpanded={!collapsedSections[section.id]}
            onToggle={() =>
              setCollapsedSections((current) => ({
                ...current,
                [section.id]: !current[section.id],
              }))
            }
          >
            <div className={styles.form}>
              {section.propertyKeys.map((key) => {
                const fieldSchema = properties[key];
                if (!fieldSchema || renderedKeys.has(key)) {
                  return null;
                }
                renderedKeys.add(key);
                return renderField(key, fieldSchema);
              })}
            </div>
          </ExpandableSection>
        ))}
        {ungroupedProperties.map(([key, fieldSchema]) =>
          renderField(key, fieldSchema)
        )}
      </div>
    </FormProvider>
  );
};
