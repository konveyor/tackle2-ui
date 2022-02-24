import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AxiosError, AxiosPromise, AxiosResponse } from "axios";
import { useFormik, FormikProvider, FormikHelpers } from "formik";
import { object, string } from "yup";
import {
  ActionGroup,
  Alert,
  Button,
  ButtonVariant,
  Form,
  FormGroup,
  Switch,
  TextInput,
} from "@patternfly/react-core";
import {
  OptionWithValue,
  SingleSelectFetchOptionValueFormikField,
} from "@app/shared/components";
import { DEFAULT_SELECT_MAX_HEIGHT } from "@app/Constants";
import {
  getAxiosErrorMessage,
  getValidatedFromError,
  getValidatedFromErrorTouched,
} from "@app/utils/utils";
import validationSchema from "./proxies-validation-schema";
import { HOST, IDENTITY, PORT } from "./field-names";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import { useFetchIdentities } from "@app/shared/hooks/useFetchIdentities";
import {
  IdentityDropdown,
  toIdentityDropdown,
  toIdentityDropdownOptionWithValue,
} from "@app/utils/model-utils";
import { PageRepresentation, Proxy } from "@app/api/models";
import { createProxy, updateProxy } from "@app/api/rest";

export interface FormValues {
  host: string;
  identity: IdentityDropdown | null;
  port: number;
}

export interface ProxyFormProps {
  proxy?: Proxy;
  isSecure?: boolean;
  onSaved: (response: AxiosResponse<any>) => void;
  onCancel: () => void;
}

export const ProxyForm: React.FC<ProxyFormProps> = ({
  proxy,
  isSecure,
  onSaved,
  onCancel,
}) => {
  const [error, setError] = useState<AxiosError>();
  const [isLoading, setIsLoading] = useState(false);
  const [isHttpIdentityRequired, setIsHttpIdentityRequired] = useState(false);
  const [isHttpsIdentityRequired, setIsHttpsIdentityRequired] = useState(false);

  const {
    identities,
    isFetching: isFetchingIdentities,
    fetchError: fetchErrorIdentities,
    fetchIdentities,
  } = useFetchIdentities();

  useEffect(() => {
    fetchIdentities();
  }, [fetchIdentities]);

  const onSubmit = (
    formValues: FormValues,
    formikHelpers: FormikHelpers<FormValues>
  ) => {
    const payload: Proxy = {
      createUser: "Ian Bolton",
      kind: isSecure ? "https" : "http",
      host: formValues.host,
      identity: formValues.identity?.id || 0,
      port: formValues.port,
    };

    let promise: AxiosPromise<Proxy>;
    if (proxy) {
      promise = updateProxy({
        ...proxy,
        ...payload,
      });
    } else {
      promise = createProxy(payload);
    }
    promise
      .then((response) => {
        formikHelpers.setSubmitting(false);
        onSaved(response);
      })
      .catch((error) => {
        formikHelpers.setSubmitting(false);
        setError(error);
      });
  };

  const identityInitialValue = useMemo(() => {
    let result: IdentityDropdown | null = null;
    if (proxy && identities && identities.data) {
      const identityId = Number(proxy.identity);
      const identity = identities.data.find((i) => i.id === identityId);

      if (identity) {
        result = toIdentityDropdown({
          id: identityId,
          name: identity.name,
        });
      }
    }
    console.log("result", result);
    return result;
  }, [identities, proxy]);

  const initialValues: FormValues = {
    [HOST]: proxy?.host || "",
    [PORT]: proxy?.port || 8080,
    [IDENTITY]: identityInitialValue,
  };
  console.log("initialValues", initialValues);
  const formik = useFormik({
    initialValues: initialValues,
    validationSchema: validationSchema({
      [HOST]: true,
      [PORT]: false,
      [IDENTITY]: isHttpIdentityRequired || isHttpsIdentityRequired,
    }),
    onSubmit: onSubmit,
  });

  const onChangeIsHttpIdentityRequired = () => {
    setIsHttpIdentityRequired(!isHttpIdentityRequired);
  };

  const onChangeIsHttpsIdentityRequired = () => {
    setIsHttpsIdentityRequired(!isHttpsIdentityRequired);
  };

  const onChangeField = (value: string, event: React.FormEvent<any>) => {
    formik.handleChange(event);
  };

  return (
    <FormikProvider value={formik}>
      <Form className={spacing.mMd} onSubmit={formik.handleSubmit}>
        {error && (
          <Alert
            variant="danger"
            isInline
            title={getAxiosErrorMessage(error)}
          />
        )}
        <FormGroup
          label={isSecure ? "HTTPS proxy host" : "HTTP proxy host"}
          fieldId="host"
          isRequired={true}
          validated={getValidatedFromError(formik.errors.host)}
          helperTextInvalid={formik.errors.host}
        >
          <TextInput
            type="text"
            name={HOST}
            aria-label="host"
            aria-describedby="host"
            isRequired={true}
            onChange={onChangeField}
            onBlur={formik.handleBlur}
            value={formik.values.host}
            validated={getValidatedFromErrorTouched(
              formik.errors.host,
              formik.touched.host
            )}
          />
        </FormGroup>
        <FormGroup
          label={isSecure ? "HTTPS proxy port" : "HTTP proxy port"}
          fieldId="port"
          isRequired={true}
          validated={getValidatedFromError(formik.errors.port)}
          helperTextInvalid={formik.errors.port}
        >
          <TextInput
            type="number"
            name={PORT}
            aria-label="port"
            aria-describedby="port"
            isRequired={true}
            onChange={onChangeField}
            onBlur={formik.handleBlur}
            value={formik.values.port}
            validated={getValidatedFromErrorTouched(
              formik.errors.port,
              formik.touched.port
            )}
          />
        </FormGroup>
        <Switch
          id="identityRequired"
          className="identityRequired"
          label={
            isSecure ? "HTTPS proxy credentials" : "HTTP proxy credentials"
          }
          aria-label="identity required"
          isChecked={isHttpIdentityRequired}
          onChange={onChangeIsHttpIdentityRequired}
        />
        {isHttpIdentityRequired && (
          <FormGroup
            label="Http proxy credentials"
            fieldId={IDENTITY}
            isRequired={isHttpIdentityRequired}
            validated={getValidatedFromErrorTouched(
              formik.errors.identity,
              formik.touched.identity
            )}
            helperTextInvalid={formik.errors.identity}
          >
            <SingleSelectFetchOptionValueFormikField
              fieldConfig={{ name: IDENTITY }}
              selectConfig={{
                variant: "typeahead",
                "aria-label": "identity",
                "aria-describedby": "identity",
                typeAheadAriaLabel: "identity",
                toggleAriaLabel: "identity",
                clearSelectionsAriaLabel: "identity",
                removeSelectionAriaLabel: "identity",
                placeholderText: "Select identity type",
                menuAppendTo: () => document.body,
                maxHeight: DEFAULT_SELECT_MAX_HEIGHT,
                fetchError: fetchErrorIdentities,
                isFetching: isFetchingIdentities,
              }}
              options={(identities?.data || []).map(toIdentityDropdown)}
              toOptionWithValue={toIdentityDropdownOptionWithValue}
            />
          </FormGroup>
        )}
        {isHttpsIdentityRequired && (
          <FormGroup
            label="Https proxy credentials"
            fieldId={IDENTITY}
            isRequired={isHttpsIdentityRequired}
            validated={getValidatedFromErrorTouched(
              formik.errors.identity,
              formik.touched.identity
            )}
            helperTextInvalid={formik.errors.identity}
          >
            <SingleSelectFetchOptionValueFormikField
              fieldConfig={{ name: IDENTITY }}
              selectConfig={{
                variant: "typeahead",
                "aria-label": "identity",
                "aria-describedby": "identity",
                typeAheadAriaLabel: "identity",
                toggleAriaLabel: "identity",
                clearSelectionsAriaLabel: "identity",
                removeSelectionAriaLabel: "identity",
                placeholderText: "Select identity type",
                menuAppendTo: () => document.body,
                maxHeight: DEFAULT_SELECT_MAX_HEIGHT,
                fetchError: fetchErrorIdentities,
                isFetching: isFetchingIdentities,
              }}
              options={(identities?.data || []).map(toIdentityDropdown)}
              toOptionWithValue={toIdentityDropdownOptionWithValue}
            />
          </FormGroup>
        )}

        <ActionGroup>
          <Button
            type="submit"
            aria-label="submit"
            variant={ButtonVariant.primary}
            isDisabled={
              !formik.isValid ||
              !formik.dirty ||
              formik.isSubmitting ||
              formik.isValidating
            }
          >
            {!proxy ? "Save" : "Update"}
          </Button>
        </ActionGroup>
      </Form>
    </FormikProvider>
  );
};
