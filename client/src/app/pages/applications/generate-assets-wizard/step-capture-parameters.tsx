import * as React from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { UseFormReturn, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import * as yup from "yup";
import {
  Alert,
  AlertVariant,
  Content,
  Form,
  Panel,
  PanelMain,
  PanelMainBody,
} from "@patternfly/react-core";

import { JsonDocument, JsonSchemaObject, TargetProfile } from "@app/api/models";
import { HookFormPFGroupController } from "@app/components/HookFormPFFields";
import { SchemaDefinedField } from "@app/components/schema-defined-fields";
import { jsonSchemaToYupSchema } from "@app/components/schema-defined-fields/utils";
import { useFetchGenerators } from "@app/queries/generators";
import {
  combineSchemas,
  isSchemaEmpty,
  schemaDefaults,
} from "@app/utils/json-schema";
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
    () =>
      allGenerators.filter(
        (g) => Object.keys(g?.params?.properties ?? {}).length > 0
      ),
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
    const schemas = generators
      .map((g) => g.params)
      .filter(
        (params): params is JsonSchemaObject =>
          Object.keys(params?.properties ?? {}).length > 0
      );
    return schemas.length === 0 ? undefined : combineSchemas(schemas);
  }, [generators]);

  // Show one collapsible section per generator, listing the parameters it
  // contributes to the combined schema.
  const sections = React.useMemo(
    () =>
      generators.map((g) => ({
        id: String(g.id),
        title: g.name,
        propertyKeys: Object.keys(g.params?.properties ?? {}),
      })),
    [generators]
  );

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
  const { setValue, getValues, control } = form;

  const defaults = React.useMemo(() => schemaDefaults(schema), [schema]);

  // Update form values when the combined schema changes. Values the user has
  // already entered win over the schema defaults, so re-entering the step keeps
  // earlier input.
  React.useEffect(() => {
    if (schema) {
      setValue("schema", schema);
      setValue("parametersRequired", !isSchemaEmpty(schema));
      setValue("parameters", {
        ...defaults,
        ...(getValues("parameters") ?? {}),
      });
    } else {
      setValue("schema", undefined);
      setValue("parametersRequired", false);
    }
  }, [schema, defaults, setValue, getValues]);

  useParametersStateChangeHandler(form, onParametersChanged);

  return (
    <>
      <Content style={{ marginBottom: "var(--pf-t--global--spacer--lg)" }}>
        <Content component="h3">
          {t("generateAssetsWizard.captureParameters.title")}
        </Content>

        {targetProfile ? (
          <Content component="p">
            {t("generateAssetsWizard.captureParameters.description", {
              count: generators.length,
              name: targetProfile?.name ?? "",
            })}
          </Content>
        ) : (
          <Alert
            variant={AlertVariant.danger}
            title={t(
              "generateAssetsWizard.captureParameters.noTargetProfileSelected"
            )}
          />
        )}
      </Content>

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
                    <SchemaDefinedField
                      id={name}
                      sections={sections}
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
