import * as React from "react";
import { useTranslation } from "react-i18next";
import { useForm, useWatch, UseFormReturn } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

import { Form, TextContent, Text } from "@patternfly/react-core";

import { JsonDocument, SourcePlatform, TargetedSchema } from "@app/api/models";
import { useFetchPlatformDiscoveryFilterSchema } from "@app/queries/schemas";
import { SchemaDefinedField } from "@app/components/schema-defined-fields/SchemaDefinedFields";
import { HookFormPFGroupController } from "@app/components/HookFormPFFields";
import { jsonSchemaToYupSchema } from "@app/components/schema-defined-fields/utils";
import { usePlatformKindList } from "../usePlatformKindList";

interface FiltersFormValues {
  filterRequired: boolean;
  schema?: TargetedSchema;
  document?: JsonDocument;
}

export interface FilterState {
  filterRequired: boolean;
  schema?: TargetedSchema;
  document?: JsonDocument;
  isValid: boolean;
}

const useFilterStateChangeHandler = (
  form: UseFormReturn<FiltersFormValues>,
  onFiltersChanged: (filterState: FilterState) => void
) => {
  const {
    control,
    formState: { isValid },
  } = form;

  const watchedValues = useWatch({
    control,
    name: ["schema", "document", "filterRequired"],
  });

  const filterState = React.useMemo((): FilterState => {
    const [schema, document, filterRequired] = watchedValues;
    return {
      filterRequired,
      schema,
      document,
      isValid,
    };
  }, [watchedValues, isValid]);

  React.useEffect(() => {
    onFiltersChanged(filterState);
  }, [onFiltersChanged, filterState]);
};

export const FilterInput: React.FC<{
  platform: SourcePlatform;
  onFiltersChanged: (filterState: FilterState) => void;
  initialFilters?: FilterState;
}> = ({ platform, onFiltersChanged, initialFilters }) => {
  const { t } = useTranslation();
  const { getDisplayLabel } = usePlatformKindList();

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

  const form = useForm<FiltersFormValues>({
    defaultValues: {
      filterRequired: initialFilters?.filterRequired ?? true,
      schema: initialFilters?.schema ?? undefined,
      document: initialFilters?.document ?? {},
    },
    resolver: yupResolver(validationSchema),
    mode: "all",
  });
  const { setValue, control } = form;

  // Fetch the discovery filter schema for the platform
  const { filtersSchema } = useFetchPlatformDiscoveryFilterSchema(
    platform?.kind
  );

  // Update form values that react to schema changes
  React.useEffect(() => {
    // TODO: If the schema is undefined, it could be a 404 and we should not require a filter
    if (filtersSchema) {
      setValue("schema", filtersSchema);
      setValue("filterRequired", true);
    } else {
      setValue("schema", undefined);
      setValue("filterRequired", false);
    }
  }, [filtersSchema, setValue]);

  useFilterStateChangeHandler(form, onFiltersChanged);

  return (
    <div>
      <TextContent style={{ marginBottom: "var(--pf-v5-global--spacer--lg)" }}>
        <Text component="h3">
          {t("platformDiscoverWizard.filterInput.title")}
        </Text>
        <Text component="p">
          {t("platformDiscoverWizard.filterInput.description", {
            platformName: platform?.name,
            platformKind: getDisplayLabel(platform?.kind),
          })}
        </Text>
      </TextContent>

      {/* TODO: Show a loading state while the filter schema is loading */}

      {!filtersSchema ? (
        <div style={{ padding: "20px" }}>
          <Text>
            {t("platformDiscoverWizard.filterInput.noFiltersAvailable", {
              platformKind: getDisplayLabel(platform?.kind),
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
