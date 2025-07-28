import React, { useMemo } from "react";
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

import type { New, Generator, Repository } from "@app/api/models";
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
import {
  useCreateGeneratorMutation,
  useFetchGenerators,
  useUpdateGeneratorMutation,
} from "@app/queries/generators";
import { useGeneratorProviderList } from "../../useGeneratorProviderList";
import { parametersToArray, arrayToParameters } from "../../utils";
import { GeneratorFormValues as GeneratorValuesSection } from "./generator-form-values";
import { GeneratorFormParameters as GeneratorParametersSection } from "./generator-form-parameters";
import { GeneratorFormRepository as GeneratorRepositorySection } from "./generator-form-repository";
import { matchItemsToRef } from "@app/utils/model-utils";

export interface GeneratorFormValues {
  kind: string;
  name: string;
  description?: string;
  repository: Repository;
  credentials?: string;
  values?: Array<{ key: string; value: string }>;
  params?: Array<{ key: string; value: string }>;
}

export interface GeneratorFormProps {
  generator?: Generator | null;
  onClose: () => void;
}

const EMPTY_REPOSITORY: Repository = {
  kind: "",
  url: "",
  path: "",
  branch: "",
};

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
  generator = null,
  onClose,
}) => {
  const { t } = useTranslation();

  const {
    providersList,
    existingGenerators,
    createGenerator,
    updateGenerator,
    identityToRef,
  } = useGeneratorFormData({
    onActionSuccess: onClose,
  });

  // Memoize validation schema to prevent recreation
  const validationSchema = useMemo(
    () =>
      yup.object().shape({
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
            t("validation.duplicateName", { type: "generator" }),
            (value) =>
              existingGenerators
                ? duplicateNameCheck(existingGenerators, generator, value ?? "")
                : false
          ),
        description: yup
          .string()
          .trim()
          .max(100, t("validation.maxLength", { length: 100 })),
        credentials: yup
          .string()
          .trim()
          .max(250, t("validation.maxLength", { length: 250 }))
          .nullable(),
        repository: yup.object().shape({
          kind: yup.string().trim().required().oneOf(["git", "subversion"]),
          url: yup.string().trim().required().repositoryUrl("kind"),
          branch: yup
            .string()
            .trim()
            .max(50, t("validation.maxLength", { length: 50 })),
          path: yup
            .string()
            .trim()
            .max(100, t("validation.maxLength", { length: 100 })),
        }),
        values: yup.array().of(
          yup.object().shape({
            key: yup.string().trim().required("A key is required"),
            value: yup.string().trim().required("A value is required"),
          })
        ),
        params: yup.array().of(
          yup.object().shape({
            key: yup.string().trim().required("A key is required"),
            value: yup.string().trim().required("A value is required"),
          })
        ),
      }),
    [t, existingGenerators, generator]
  );

  const defaultValues = useMemo(
    () =>
      !generator
        ? {
            kind: "",
            name: "",
            description: "",
            repository: EMPTY_REPOSITORY,
            credentials: "",
            values: [],
            params: [],
          }
        : {
            kind: generator.kind,
            name: generator.name,
            description: generator?.description,
            repository: generator.repository || EMPTY_REPOSITORY,
            credentials: generator?.identity?.name,
            values: parametersToArray(generator.values),
            params: parametersToArray(generator.params),
          },
    [generator]
  );

  const formMethods = useForm<GeneratorFormValues>({
    defaultValues,
    resolver: yupResolver(validationSchema),
    mode: "all",
  });

  const {
    handleSubmit,
    formState: { isSubmitting, isValidating, isValid, isDirty },
    control,
  } = formMethods;

  const onValidSubmit = (values: GeneratorFormValues) => {
    const payload: New<Generator> = {
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
      identity: identityToRef(values.credentials),
      values: arrayToParameters(values.values),
      params: arrayToParameters(values.params),
    };

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

        {/* Repository section */}
        <GeneratorRepositorySection />

        {/* Values section */}
        <GeneratorValuesSection />

        {/* Parameters section */}
        <GeneratorParametersSection />

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
  onActionSuccess,
  onActionFail,
}: {
  onActionSuccess?: () => void;
  onActionFail?: () => void;
} = {}) => {
  const { t } = useTranslation();
  const { pushNotification } = React.useContext(NotificationsContext);

  // Fetch data
  const { identities, isSuccess: isIdentitiesSuccess } = useFetchIdentities();
  const providersList = useGeneratorProviderList();
  const { generators: existingGenerators, isSuccess: isGeneratorsSuccess } =
    useFetchGenerators();

  // Mutation notification handlers
  const onCreateSuccess = () => {
    pushNotification({
      title: t("toastr.success.createWhat", {
        type: t("terms.new"),
        what: t("terms.generator").toLocaleLowerCase(),
      }),
      variant: "success",
    });
    onActionSuccess?.();
  };

  const onUpdateSuccess = (_id: number) => {
    pushNotification({
      title: t("toastr.success.save", {
        type: t("terms.generator").toLocaleLowerCase(),
      }),
      variant: "success",
    });
    onActionSuccess?.();
  };

  const onCreateUpdateError = (error: AxiosError) => {
    pushNotification({
      title: getAxiosErrorMessage(error),
      variant: "danger",
    });
    onActionFail?.();
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
    identities,
    providersList,
    isDataReady: isGeneratorsSuccess && isIdentitiesSuccess,
    createGenerator,
    updateGenerator,
    identityToRef: (name?: string) =>
      matchItemsToRef(identities, ({ name }) => name, name),
  };
};
