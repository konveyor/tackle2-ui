import React from "react";
import { useTranslation } from "react-i18next";
import { AxiosError } from "axios";
import { useForm, FormProvider } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import {
  ActionGroup,
  Button,
  ButtonVariant,
  Form,
} from "@patternfly/react-core";

import type { New, AssetGenerator, Repository } from "@app/api/models";
import {
  HookFormPFGroupController,
  HookFormPFTextInput,
} from "@app/components/HookFormPFFields";
import { NotificationsContext } from "@app/components/NotificationsContext";

import { duplicateNameCheck, getAxiosErrorMessage } from "@app/utils/utils";

import { ConditionalRender } from "@app/components/ConditionalRender";
import { AppPlaceholder } from "@app/components/AppPlaceholder";
import { SimpleSelect } from "@app/components/SimpleSelect";
import { DEFAULT_SELECT_MAX_HEIGHT } from "@app/Constants";
import { useFetchIdentities } from "@app/queries/identities";
import { useGeneratorProviderList } from "../../useGeneratorProviderList";
import {
  useCreateGeneratorMutation,
  useFetchGenerators,
  useUpdateGeneratorMutation,
} from "@app/queries/generators";
import { parametersToArray, arrayToParameters } from "../../utils";
import { GeneratorFormValues as GeneratorValuesSection } from "./generator-form-values";
import { GeneratorFormParameters as GeneratorParametersSection } from "./generator-form-parameters";
import { GeneratorFormRepository as GeneratorRepositorySection } from "./generator-form-repository";

export interface GeneratorFormValues {
  kind: string;
  name: string;
  description: string;
  repository: Repository;
  credentials?: string;
  parameters?: Array<{ key: string; value: string }>;
  values?: Array<{ key: string; value: string }>;
}

export interface GeneratorFormProps {
  generator?: AssetGenerator | null;
  onClose: () => void;
}

const kindOptions = [
  {
    value: "git",
    toString: () => `Git`,
  },
  {
    value: "subversion",
    toString: () => `Subversion`,
  },
];

// Wait for all data to be ready before rendering so existing data is rendered!
export const GeneratorForm: React.FC<GeneratorFormProps> = ({ ...rest }) => {
  const { isDataReady } = useGeneratorFormData();
  return (
    <ConditionalRender when={!isDataReady} then={<AppPlaceholder />}>
      <GeneratorFormRenderer {...rest} />
    </ConditionalRender>
  );
};

const GeneratorFormRenderer: React.FC<GeneratorFormProps> = ({
  generator,
  onClose,
}) => {
  const { t } = useTranslation();

  const providersList = useGeneratorProviderList();

  const { existingGenerators, createGenerator, updateGenerator } =
    useGeneratorFormData({
      onActionSuccess: onClose,
    });

  const { identities } = useFetchIdentities();
  const identitiesOptions = identities.map((identity) => identity.name);

  const validationSchema = yup.object().shape({
    kind: yup
      .string()
      .trim()
      .required(t("validation.required"))
      .min(3, t("validation.minLength", { length: 3 }))
      .max(120, t("validation.maxLength", { length: 120 })),

    name: yup
      .string()
      .trim()
      .required(t("validation.required"))
      .min(3, t("validation.minLength", { length: 3 }))
      .max(120, t("validation.maxLength", { length: 120 }))
      .test(
        "Duplicate name",
        t("validation.duplicateName", { type: "platform" }),
        (value) =>
          existingGenerators
            ? duplicateNameCheck(
                existingGenerators,
                generator || null,
                value ?? ""
              )
            : false
      ),

    // url: yup
    //   .string()
    //   .trim()
    //   .required(t("validation.required"))
    //   .url(t("validation.url")),

    credentials: yup
      .string()
      .trim()
      .max(250, t("validation.maxLength", { length: 250 }))
      .nullable(),
  });

  const emptyRepository: Repository = {
    kind: "",
    url: "",
    path: "",
    branch: "",
  };

  const formMethods = useForm<GeneratorFormValues>({
    defaultValues: !generator
      ? {
          kind: "",
          name: "",
          description: "",
          repository: emptyRepository,
          credentials: "",
          parameters: [],
          values: [],
        }
      : {
          kind: generator.kind,
          name: generator.name,
          description: generator.description || "",
          repository: generator.repository || emptyRepository,
          credentials: identities.find(
            (identity) => identity.id === generator.identity?.id
          )?.name,
          parameters:
            Object.keys(generator?.parameters || {}).length > 0
              ? parametersToArray(generator.parameters)
              : [{ key: "", value: "" }],
          values:
            Object.keys(generator?.values || {}).length > 0
              ? parametersToArray(generator.values)
              : [{ key: "", value: "" }],
        },
    resolver: yupResolver(validationSchema),
    mode: "all",
  });

  const {
    handleSubmit,
    trigger,
    formState: { isSubmitting, isValidating, isValid, isDirty },
    control,
  } = formMethods;

  const getIdentity = (identityName: string | undefined) => {
    const temp = identities.find((identity) => identity.name === identityName);
    return temp ? { id: temp.id, name: temp.name } : undefined;
  };

  const onValidSubmit = (values: GeneratorFormValues) => {
    const payload: New<AssetGenerator> = {
      name: values.name,
      kind: values.kind,
      description: values.description,
      repository: values.repository
        ? {
            kind: values.repository.kind?.trim(),
            url: values.repository.url?.trim(),
            branch: values.repository.branch?.trim(),
            path: values.repository.path?.trim(),
          }
        : undefined,
      identity: getIdentity(values.credentials),
      parameters: arrayToParameters(values.parameters),
      values: arrayToParameters(values.values),
    };
    const identity = getIdentity(values.credentials);
    if (identity) {
      payload.identity = identity;
    }

    if (generator) {
      updateGenerator({
        id: generator.id,
        ...payload,
      });
    } else {
      createGenerator(payload);
    }
  };

  return (
    <FormProvider {...formMethods}>
      <Form onSubmit={handleSubmit(onValidSubmit)} id="generator-form">
        <HookFormPFTextInput
          control={control}
          name="name"
          label={t("terms.name")}
          fieldId="name"
          isRequired
        />

        <HookFormPFGroupController
          control={control}
          name="kind"
          label={t("terms.generatorType")}
          fieldId="kind"
          isRequired
          renderInput={({ field: { value, name, onChange } }) => (
            <>
              <SimpleSelect
                maxHeight={DEFAULT_SELECT_MAX_HEIGHT}
                placeholderText={t("composed.selectOne", {
                  what: t("terms.generatorType").toLowerCase(),
                })}
                variant="typeahead"
                toggleId="generator-type-toggle"
                id="generator-type-select"
                toggleAriaLabel="Generator type select dropdown toggle"
                aria-label={name}
                value={value}
                options={providersList || []}
                onChange={(selection) => {
                  onChange(selection);
                }}
                onClear={() => onChange("")}
              />
            </>
          )}
        />

        <HookFormPFTextInput
          control={control}
          name="description"
          label={t("terms.description")}
          fieldId="description"
        />

        <HookFormPFGroupController
          control={control}
          name="credentials"
          label={t("terms.credentials")}
          fieldId="credentials"
          renderInput={({ field: { value, name, onChange } }) => (
            <>
              <SimpleSelect
                maxHeight={DEFAULT_SELECT_MAX_HEIGHT}
                placeholderText={t("composed.selectOne", {
                  what: t("terms.credentials").toLowerCase(),
                })}
                variant="typeahead"
                toggleId="credentials-toggle"
                id="credentials-select"
                toggleAriaLabel="Credentials select dropdown toggle"
                aria-label={name}
                value={value}
                options={identitiesOptions}
                onChange={(selection) => {
                  onChange(selection);
                }}
                onClear={() => onChange("")}
              />
            </>
          )}
        />

        {/* Repository section */}
        <GeneratorRepositorySection
          control={control}
          trigger={trigger}
          kindOptions={kindOptions}
        />

        {/* Parameters section */}
        <GeneratorParametersSection collection={generator?.parameters || {}} />

        {/* Values section */}
        <GeneratorValuesSection collection={generator?.values || {}} />

        <ActionGroup>
          <Button
            type="submit"
            id="submit"
            aria-label="submit"
            variant={ButtonVariant.primary}
            isDisabled={!isValid || isSubmitting || isValidating || !isDirty}
          >
            {!generator ? t("actions.create") : t("actions.save")}
          </Button>
          <Button
            type="button"
            id="cancel"
            aria-label="cancel"
            variant={ButtonVariant.link}
            isDisabled={isSubmitting || isValidating}
            onClick={onClose}
          >
            {t("actions.cancel")}
          </Button>
        </ActionGroup>
      </Form>
    </FormProvider>
  );
};

const useGeneratorFormData = ({
  onActionSuccess = () => {},
}: {
  onActionSuccess?: () => void;
} = {}) => {
  const { t } = useTranslation();
  const { pushNotification } = React.useContext(NotificationsContext);

  // Fetch data
  const { generators: existingGenerators, isSuccess: isGeneratorsSuccess } =
    useFetchGenerators();

  // Mutation notification handlers
  const onCreateSuccess = () => {
    pushNotification({
      title: t("toastr.success.createWhat", {
        type: t("terms.generator").toLocaleLowerCase(),
      }),
      variant: "success",
    });
    onActionSuccess();
  };

  const onUpdateSuccess = (_id: number) => {
    pushNotification({
      title: t("toastr.success.save", {
        type: t("terms.generator").toLocaleLowerCase(),
      }),
      variant: "success",
    });
    onActionSuccess();
  };

  const onCreateUpdateError = (error: AxiosError) => {
    pushNotification({
      title: getAxiosErrorMessage(error),
      variant: "danger",
    });
  };

  const { mutate: createGenerator } = useCreateGeneratorMutation(
    onCreateSuccess,
    onCreateUpdateError
  );

  const { mutate: updateGenerator } = useUpdateGeneratorMutation(
    onUpdateSuccess,
    onCreateUpdateError
  );

  return {
    existingGenerators,
    isDataReady: isGeneratorsSuccess && existingGenerators,
    createGenerator,
    updateGenerator,
  };
};
