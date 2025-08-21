import * as React from "react";
import { useTranslation } from "react-i18next";
import { useForm, useWatch, UseFormReturn } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

import {
  Form,
  TextContent,
  Text,
  Alert,
  AlertVariant,
} from "@patternfly/react-core";

import { JsonDocument, JsonSchemaObject } from "@app/api/models";
import { DecoratedApplication } from "../useDecoratedApplications";
import { ParameterState } from "./useWizardReducer";
import { SchemaDefinedField } from "@app/components/schema-defined-fields/SchemaDefinedFields";
import { HookFormPFGroupController } from "@app/components/HookFormPFFields";
import { jsonSchemaToYupSchema } from "@app/components/schema-defined-fields/utils";
import { useFetchGenerators } from "@app/queries/generators";

interface ParametersFormValues {
  parametersRequired: boolean;
  schema?: JsonSchemaObject;
  parameters?: JsonDocument;
}

const useParametersStateChangeHandler = (
  form: UseFormReturn<ParametersFormValues>,
  onParametersChanged: (parameterState: ParameterState) => void
) => {
  const {
    control,
    formState: { isValid },
  } = form;

  const watchedValues = useWatch({
    control,
    name: ["schema", "parameters", "parametersRequired"],
  });

  const parameterState = React.useMemo((): ParameterState => {
    const [schema, parameters, parametersRequired] = watchedValues;
    return {
      parametersRequired,
      schema,
      parameters,
      isValid: parametersRequired ? isValid : true,
    };
  }, [watchedValues, isValid]);

  React.useEffect(() => {
    onParametersChanged(parameterState);
  }, [onParametersChanged, parameterState]);
};

export const CaptureParameters: React.FC<{
  applications: DecoratedApplication[];
  targetProfile?: { generators: { id: number; name: string }[] };
  onParametersChanged: (parameters: ParameterState) => void;
  initialParameters?: ParameterState;
}> = ({
  applications,
  targetProfile,
  onParametersChanged,
  initialParameters,
}) => {
  const { t } = useTranslation();
  const { generators } = useFetchGenerators();

  // Create a combined schema from all generators in the target profile
  const combinedSchema = React.useMemo((): JsonSchemaObject | undefined => {
    if (!targetProfile?.generators || !generators) return undefined;

    const profileGenerators = generators.filter((g) =>
      targetProfile.generators.some((pg) => pg.id === g.id)
    );

    if (profileGenerators.length === 0) return undefined;

    // Create a combined schema from all generator parameters
    const properties: Record<string, any> = {};
    const required: string[] = [];

    profileGenerators.forEach((generator) => {
      if (generator.params) {
        // If generator has parameter schema definition, add to combined schema
        Object.entries(generator.params).forEach(([key, value]) => {
          properties[`${generator.name}_${key}`] = {
            type: "string",
            title: `${generator.name} - ${key}`,
            description: `Parameter for ${generator.name} generator`,
          };
        });
      } else {
        // Default parameter for generator without specific schema
        properties[`${generator.name}_params`] = {
          type: "string",
          title: `${generator.name} Parameters`,
          description: `Parameters for ${generator.name} generator`,
        };
      }
    });

    return {
      type: "object",
      properties,
      required,
    };
  }, [targetProfile, generators]);

  const validationSchema = yup.object().shape({
    schema: yup.object().nullable(),
    parameters: yup
      .object()
      .when("schema", (schema: JsonSchemaObject | undefined) => {
        return schema
          ? jsonSchemaToYupSchema(schema, t)
          : yup.object().nullable();
      }),
  });

  const form = useForm<ParametersFormValues>({
    defaultValues: {
      parametersRequired: initialParameters?.parametersRequired ?? true,
      schema: initialParameters?.schema ?? combinedSchema,
      parameters: initialParameters?.parameters ?? {},
    },
    resolver: yupResolver(validationSchema),
    mode: "all",
  });
  const { setValue, control } = form;

  // Update form values when schema changes
  React.useEffect(() => {
    if (combinedSchema) {
      setValue("schema", combinedSchema);
      setValue("parametersRequired", true);
    } else {
      setValue("schema", undefined);
      setValue("parametersRequired", false);
    }
  }, [combinedSchema, setValue]);

  useParametersStateChangeHandler(form, onParametersChanged);

  return (
    <div>
      <TextContent style={{ marginBottom: "var(--pf-v5-global--spacer--lg)" }}>
        <Text component="h3">
          {t("generateAssetsWizard.captureParameters.title")}
        </Text>
        <Text component="p">
          {t("generateAssetsWizard.captureParameters.description")}
        </Text>
      </TextContent>

      {!targetProfile ? (
        <Alert
          variant={AlertVariant.info}
          title={t(
            "generateAssetsWizard.captureParameters.noTargetProfileSelected"
          )}
        />
      ) : !combinedSchema ? (
        <div style={{ padding: "20px" }}>
          <Text>
            {t("generateAssetsWizard.captureParameters.noParametersRequired")}
          </Text>
        </div>
      ) : (
        <Form>
          <HookFormPFGroupController
            control={control}
            name="parameters"
            label={t("generateAssetsWizard.captureParameters.parametersLabel")}
            fieldId="parameters"
            renderInput={({ field: { value, name, onChange } }) => (
              <SchemaDefinedField
                key={targetProfile?.generators?.map((g) => g.id).join("-")}
                id={name}
                jsonDocument={value ?? {}}
                jsonSchema={combinedSchema}
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
