import * as React from "react";
import { TFunction } from "i18next";
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

/**
 * JSON Schema property names are literal strings, and generator parameters use
 * dotted Helm paths as names (e.g. "workspace.storageSize").  react-hook-form
 * treats a dot in a field name as a path separator, so registering such a name
 * writes the value into a nested object and leaves the flat key untouched --
 * the document ends up with both `{"workspace.storageSize": "1Gi"}` and
 * `{"workspace": {"storageSize": "4Gi"}}`.  Encode the dots when passing names
 * to react-hook-form, and decode them when handing the document back.
 */
const KEY_SEPARATOR = "\u0000";

const encodeKey = (key: string) => key.replaceAll(".", KEY_SEPARATOR);
const decodeKey = (key: string) => key.split(KEY_SEPARATOR).join(".");

/** Applies a transformation to every key of a document, recursively. */
const mapDocumentKeys = (
  value: unknown,
  mapKey: (key: string) => string
): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => mapDocumentKeys(item, mapKey));
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        mapKey(key),
        mapDocumentKeys(entry, mapKey),
      ])
    );
  }
  return value;
};

/** Returns a copy of the schema with the same key encoding as the form values. */
const encodeSchemaKeys = (schema: JsonSchemaObject): JsonSchemaObject => {
  if (!schema.properties) {
    return schema;
  }
  return {
    ...schema,
    properties: Object.fromEntries(
      Object.entries(schema.properties).map(([key, property]) => [
        encodeKey(key),
        encodeSchemaKeys(property),
      ])
    ),
    required: schema.required?.map(encodeKey),
  };
};

interface FieldProps {
  isReadOnly?: boolean;
  fieldKey: string;
  fieldSchema: JsonSchemaObject;
  /** Field path as registered with react-hook-form (keys encoded). */
  name: string;
  /** Literal document path, used for element ids. */
  path: string;
  required?: boolean;
}

const StringField: React.FC<FieldProps> = ({
  isReadOnly,
  fieldKey,
  fieldSchema,
  name,
  path,
  required,
}) => {
  const { control } = useFormContext();
  const fieldId = `field-${path}`;

  return (
    <HookFormPFTextInput
      isDisabled={isReadOnly}
      control={control}
      name={name}
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
  name,
  path,
  required,
}) => {
  const { control } = useFormContext();
  const fieldId = `field-${path}`;

  return (
    <HookFormPFTextInput
      isDisabled={isReadOnly}
      control={control}
      name={name}
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
  name,
  path,
  required,
}) => {
  const {
    control,
    formState: { errors },
  } = useFormContext();
  const fieldId = `field-${path}`;
  const errorMessage = errors[name]?.message as string;
  const isValid = !errorMessage;

  return (
    <HookFormPFGroupController
      control={control}
      name={name}
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
  name,
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
          name={`${name}.${encodeKey(nestedKey)}`}
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
  /** Field path as registered with react-hook-form (keys encoded). */
  name: string;
  /** Literal document path, used for element ids. */
  path: string;
  parentSchema?: JsonSchemaObject;
}

const SchemaField: React.FC<SchemaFieldProps> = ({
  isReadOnly,
  fieldKey,
  fieldSchema,
  name,
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
          name={name}
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
          name={name}
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
          name={name}
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
          name={name}
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

  // Field names reach the validation messages encoded; show them decoded.
  const translate = React.useMemo(() => {
    const decodedTranslate = (key: string, values?: Record<string, unknown>) =>
      t(
        key,
        values && typeof values.name === "string"
          ? { ...values, name: decodeKey(values.name) }
          : values
      );
    return decodedTranslate as unknown as TFunction<"translation", undefined>;
  }, [t]);

  const methods = useForm({
    resolver: jsonSchemaToYupResolver(encodeSchemaKeys(jsonSchema), translate),
    defaultValues: mapDocumentKeys(jsonDocument, encodeKey) as object,
    mode: "all",
  });

  const { reset, subscribe } = methods;

  // Update form values when jsonDocument prop changes
  React.useEffect(() => {
    reset(mapDocumentKeys(jsonDocument, encodeKey) as object);
  }, [jsonDocument, reset]);

  // Call onDocumentChanged when the form values change
  React.useEffect(() => {
    const subscription = subscribe({
      formState: {
        values: true,
      },
      callback: ({ values }) => {
        onDocumentChanged?.(mapDocumentKeys(values, decodeKey) as object);
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
      name={encodeKey(key)}
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
