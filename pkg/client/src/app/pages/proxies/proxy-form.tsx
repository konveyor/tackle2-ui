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
import { createProxy, deleteProxy, updateProxy } from "@app/api/rest";

export interface FormValues {
  host: string;
  identity: IdentityDropdown | null;
  port: number;
}

export interface ProxyFormProps {
  proxy?: Proxy;
  isSecure?: boolean;
  onSaved: (response: AxiosResponse<any>) => void;
  onDelete: () => void;
}

export const ProxyForm: React.FC<ProxyFormProps> = ({
  proxy,
  isSecure,
  onSaved,
  onDelete,
}) => {
  const [error, setError] = useState<AxiosError>();
  const [isLoading, setIsLoading] = useState(false);
  const [isIdentityRequired, setIsIdentityRequired] = useState(false);

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

  const formik = useFormik({
    initialValues: initialValues,
    validationSchema: validationSchema({
      [HOST]: true,
      [PORT]: false,
      [IDENTITY]: isIdentityRequired,
    }),
    onSubmit: onSubmit,
  });

  const onChangeIsIdentityRequired = () => {
    setIsIdentityRequired(!isIdentityRequired);
  };

  const onChangeField = (value: string, event: React.FormEvent<any>) => {
    formik.handleChange(event);
  };

  const handleDeleteProxy = () => {
    let promise: AxiosPromise<Proxy>;
    if (proxy?.id) {
      promise = deleteProxy(proxy?.id);
      promise
        .then((response) => {
          formik.resetForm();
          onDelete();
        })
        .catch((error) => {
          setError(error);
        });
    } else {
      formik.resetForm();
    }
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
          id={isSecure ? "https-identity-required" : "http-identity-required"}
          className="identityRequired"
          label={
            isSecure ? "HTTPS proxy credentials" : "HTTP proxy credentials"
          }
          aria-label="identity required"
          isChecked={isIdentityRequired}
          onChange={onChangeIsIdentityRequired}
        />
        {isIdentityRequired && (
          <FormGroup
            label={
              isSecure ? "HTTPS proxy credentials" : "HTTP proxy credentials"
            }
            fieldId={IDENTITY}
            isRequired={isIdentityRequired}
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
          <Button variant={ButtonVariant.secondary} onClick={handleDeleteProxy}>
            {!proxy ? "Clear" : "Delete"}
          </Button>
        </ActionGroup>
      </Form>
    </FormikProvider>
  );
};
