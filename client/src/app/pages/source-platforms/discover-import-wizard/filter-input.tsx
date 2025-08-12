import * as React from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

import { Form, TextContent, Text } from "@patternfly/react-core";

import { JsonDocument, SourcePlatform, TargetedSchema } from "@app/api/models";
import { useFetchPlatformDiscoveryFilterSchema } from "@app/queries/schemas";
import { SchemaDefinedField } from "@app/components/schema-defined-fields/SchemaDefinedFields";
import { HookFormPFGroupController } from "@app/components/HookFormPFFields";
import { jsonSchemaToYupSchema } from "@app/components/schema-defined-fields/utils";

interface FiltersFormValues {
  schema?: TargetedSchema;
  document?: JsonDocument;
}

export interface FilterState {
  filterRequired: boolean;
  schema?: TargetedSchema;
  document?: JsonDocument;
  isValid: boolean;
}

export const FilterInput: React.FC<{
  platform: SourcePlatform;
  onFiltersChanged: (filterState: FilterState) => void;
}> = ({ platform, onFiltersChanged }) => {
  const { t } = useTranslation();

  const validationSchema = yup.object().shape({
    schema: yup.object().nullable(),
    document: yup
      .object()
      .when("schema", (schema: TargetedSchema | undefined) => {
        return schema
          ? jsonSchemaToYupSchema(schema.definition, t)
          : yup.object().nullable();
      }),
  });

  const {
    control,
    reset,
    getValues,
    watch,
    formState: { isValid },
  } = useForm<FiltersFormValues>({
    defaultValues: {
      schema: undefined,
      document: {},
    },
    resolver: yupResolver(validationSchema),
    mode: "all",
  });

  // Fetch the discovery filters schema for the platform and put it in the form
  const { filtersSchema } = useFetchPlatformDiscoveryFilterSchema(
    platform?.kind
  );
  React.useEffect(() => {
    if (filtersSchema) {
      reset({
        ...getValues(),
        schema: filtersSchema,
        document: {},
      });
    } else {
      reset({
        ...getValues(),
        schema: undefined,
        document: undefined,
      });
    }
  }, [filtersSchema, reset, getValues]);

  // Relay form state changes to parent component
  const watchedValues = watch();
  React.useEffect(() => {
    // TODO: Track the filter loading state -- 404 = no filter needed, !!data = filter needed
    const filterRequired = !!filtersSchema;

    onFiltersChanged({
      filterRequired,
      schema: watchedValues.schema,
      document: watchedValues.document,
      isValid: isValid,
    });
  }, [onFiltersChanged, watchedValues, isValid, filtersSchema]);

  return (
    <div>
      <TextContent style={{ marginBottom: "var(--pf-v5-global--spacer--lg)" }}>
        <Text component="h3">
          {t("platformDiscoverWizard.filterInput.title")}
        </Text>
        <Text component="p">
          {t("platformDiscoverWizard.filterInput.description", {
            platformName: platform?.name,
            platformKind: platform?.kind,
          })}
        </Text>
      </TextContent>

      {/* TODO: Show a loading state while the filter schema is loading */}

      {!filtersSchema ? (
        <div style={{ padding: "20px" }}>
          <Text>
            {t("platformDiscoverWizard.filterInput.noFiltersAvailable", {
              platformKind: platform.kind,
            })}
          </Text>
        </div>
      ) : (
        <Form>
          <HookFormPFGroupController
            control={control}
            name="document"
            label={t("platformDiscoverWizard.filterInput.filtersLabel", {
              platformName: platform.name,
            })}
            fieldId="document"
            renderInput={({ field: { value, name, onChange } }) => (
              <SchemaDefinedField
                key={platform.kind}
                id={name}
                jsonDocument={value ?? {}}
                jsonSchema={filtersSchema.definition}
                onDocumentChanged={(newJsonDocument) => {
                  onChange(newJsonDocument);
                }}
              />
            )}
          />
        </Form>
      )}
    </div>
  );
};
