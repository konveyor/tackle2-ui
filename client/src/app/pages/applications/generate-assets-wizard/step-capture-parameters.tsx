import * as React from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { UseFormReturn, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import * as yup from "yup";
import {
  Alert,
  AlertVariant,
  Form,
  Panel,
  PanelMain,
  PanelMainBody,
  Text,
  TextContent,
} from "@patternfly/react-core";

import { JsonDocument, JsonSchemaObject, TargetProfile } from "@app/api/models";
import { HookFormPFGroupController } from "@app/components/HookFormPFFields";
import { SchemaDefinedField } from "@app/components/schema-defined-fields";
import { jsonSchemaToYupSchema } from "@app/components/schema-defined-fields/utils";
import { useFetchGenerators } from "@app/queries/generators";
import { combineSchemas, isSchemaEmpty } from "@app/utils/json-schema";
import { wrapAsEvent } from "@app/utils/utils";

export interface ParameterState {
  isValid: boolean;
  parametersRequired: boolean;
  parameters?: JsonDocument;
  schema?: JsonSchemaObject;
}
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

const useGeneratorsForTargetProfile = (targetProfile?: TargetProfile) => {
  const { generators: fetchedGenerators } = useFetchGenerators();

  const allGenerators = React.useMemo(
    () =>
      !targetProfile
        ? []
        : targetProfile.generators
            .map(({ id }) => fetchedGenerators.find((g) => g.id === id))
            .filter(Boolean),
    [targetProfile, fetchedGenerators]
  );

  const generators = React.useMemo(
    () => allGenerators.filter((g) => Object.keys(g?.params ?? {}).length > 0),
    [allGenerators]
  );

  return {
    allGenerators,
    generators,
  };
};

export const CaptureParameters: React.FC<{
  targetProfile?: TargetProfile;
  onParametersChanged: (parameters: ParameterState) => void;
  initialParameters?: ParameterState;
}> = ({ targetProfile, onParametersChanged, initialParameters }) => {
  const { t } = useTranslation();
  const { generators } = useGeneratorsForTargetProfile(targetProfile);
  const schema = React.useMemo(() => {
    return !generators
      ? undefined
      : combineSchemas(
          generators
            .filter((g) => Object.keys(g.params ?? {}).length > 0)
            .map((g) => g.params as unknown as JsonSchemaObject) // TODO: Fix this with #2498
        );
  }, [generators]);

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
      schema: initialParameters?.schema,
      parameters: initialParameters?.parameters ?? {},
    },
    resolver: yupResolver(validationSchema),
    mode: "all",
  });
  const { setValue, control } = form;

  // Update form values when the combined schema changes
  React.useEffect(() => {
    if (schema) {
      setValue("schema", schema);
      setValue("parametersRequired", !isSchemaEmpty(schema));
    } else {
      setValue("schema", undefined);
      setValue("parametersRequired", false);
    }
  }, [schema, setValue]);

  useParametersStateChangeHandler(form, onParametersChanged);

  return (
    <>
      <TextContent style={{ marginBottom: "var(--pf-v5-global--spacer--lg)" }}>
        <Text component="h3">
          {t("generateAssetsWizard.captureParameters.title")}
        </Text>

        {targetProfile ? (
          <Text component="p">
            {t("generateAssetsWizard.captureParameters.description", {
              count: generators.length,
              name: targetProfile?.name ?? "",
            })}
          </Text>
        ) : (
          <Alert
            variant={AlertVariant.danger}
            title={t(
              "generateAssetsWizard.captureParameters.noTargetProfileSelected"
            )}
          />
        )}
      </TextContent>

      <Panel>
        <PanelMain>
          <PanelMainBody>
            {isSchemaEmpty(schema) ? (
              <Alert
                variant={AlertVariant.info}
                title={t(
                  "generateAssetsWizard.captureParameters.noParametersRequired"
                )}
              />
            ) : (
              <Form>
                <HookFormPFGroupController
                  control={control}
                  name="parameters"
                  label={t(
                    "generateAssetsWizard.captureParameters.parametersLabel"
                  )}
                  fieldId="parameters"
                  renderInput={({ field: { value, name, onChange } }) => (
                    // TODO: Verify this works with the combined schema with #2498
                    <SchemaDefinedField
                      id={name}
                      jsonDocument={value ?? {}}
                      jsonSchema={schema}
                      onDocumentChanged={(newJsonDocument) => {
                        onChange(wrapAsEvent(newJsonDocument, name));
                      }}
                    />
                  )}
                />
              </Form>
            )}
          </PanelMainBody>
        </PanelMain>
      </Panel>
    </>
  );
};
