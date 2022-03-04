import React, { Fragment, useEffect, useMemo, useState } from "react";
import { AxiosError, AxiosPromise, AxiosResponse } from "axios";
import {
  useFormik,
  FormikProvider,
  FormikHelpers,
  validateYupSchema,
} from "formik";
import { object, string } from "yup";
import {
  ActionGroup,
  Alert,
  Button,
  ButtonVariant,
  Form,
  FormGroup,
  Switch,
  TextArea,
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
import {
  EXCLUDED,
  HTTPS_HOST,
  HTTPS_IDENTITY,
  HTTPS_PORT,
  HTTP_HOST,
  HTTP_IDENTITY,
  HTTP_PORT,
  IS_HTTPS_CHECKED,
  IS_HTTP_CHECKED,
} from "./field-names";
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
  httpHost: string;
  httpsHost: string;
  httpIdentity: IdentityDropdown | null;
  httpsIdentity: IdentityDropdown | null;
  httpPort: number;
  httpsPort: number;
  isHttpChecked: boolean;
  isHttpsChecked: boolean;
  excluded: string;
}

export interface ProxyFormProps {
  httpProxy?: Proxy;
  httpsProxy?: Proxy;
  isSecure?: boolean;
  onSaved: (response: AxiosResponse<any>) => void;
  onDelete: () => void;
}

export const ProxyForm: React.FC<ProxyFormProps> = ({
  httpProxy,
  httpsProxy,
  onSaved,
  onDelete,
}) => {
  const [error, setError] = useState<AxiosError>();
  const [isLoading, setIsLoading] = useState(false);
  const [isHttpIdentityRequired, setIsHttpIdentityRequired] = useState(false);
  const [isHttpsIdentityRequired, setIsHttpsIdentityRequired] = useState(false);
  const [isHttpProxy, setIsHttpProxy] = React.useState(false);
  const [isHttpsProxy, setIsHttpsProxy] = React.useState(false);

  useEffect(() => {
    setIsHttpProxy(httpProxy?.host !== "");
    setIsHttpsProxy(httpsProxy?.host !== "");
  }, [httpProxy, httpsProxy]);

  const onChangeIsHttpProxy = () => {
    // formik.setFieldValue(IS_HTTP_CHECKED, !formik.values.isHttpChecked);
    setIsHttpProxy(!isHttpProxy);

    if (formik.values.isHttpChecked) {
      formik.setFieldValue(HTTP_HOST, "");
      formik.setFieldValue(HTTP_IDENTITY, "");
    }
  };

  const onChangeIsHttpsProxy = () => {
    setIsHttpsProxy(!isHttpsProxy);
    // formik.setFieldValue(IS_HTTPS_CHECKED, !formik.values.isHttpsChecked);
    if (formik.values.isHttpsChecked) {
      formik.setFieldValue(HTTPS_HOST, "");
      formik.setFieldValue(HTTPS_IDENTITY, "");
    }
  };

  const {
    identities,
    isFetching: isFetchingIdentities,
    fetchError: fetchErrorIdentities,
    fetchIdentities,
  } = useFetchIdentities();

  useEffect(() => {
    fetchIdentities();
  }, [fetchIdentities]);

  const httpValuesHaveUpdate = (values: FormValues, httpProxy?: Proxy) => {
    if (httpProxy?.host === "" && isHttpProxy) {
      return true;
    } else {
      return (
        values.excluded !== httpProxy?.excluded.join(),
        values.httpHost !== httpProxy?.host ||
          values.httpIdentity !== httpProxy?.identity ||
          values.httpPort !== httpProxy?.port
      );
    }
  };
  const httpsValuesHaveUpdate = (values: FormValues, httpsProxy?: Proxy) => {
    if (httpsProxy?.host === "" && isHttpsProxy) {
      return true;
    }

    return (
      values.excluded !== httpsProxy?.excluded.join(),
      values.httpsHost !== httpsProxy?.host ||
        values.httpsIdentity !== httpsProxy?.identity ||
        values.httpsPort !== httpsProxy?.port
    );
  };

  const onSubmit = (
    formValues: FormValues,
    formikHelpers: FormikHelpers<FormValues>
  ) => {
    const httpsPayload: Proxy = {
      kind: "https",
      excluded: formValues.excluded.split(","),
      host: formValues.httpsHost,
      identity: formValues.httpsIdentity?.id || 0,
      port: formValues.httpsPort,
    };

    const httpPayload: Proxy = {
      kind: "http",
      excluded: formValues.excluded.split(","),
      host: formValues.httpHost,
      identity: formValues.httpIdentity?.id || 0,
      port: formValues.httpPort,
    };

    let promise: AxiosPromise<Proxy>;
    if (httpProxy && httpValuesHaveUpdate(formValues, httpProxy)) {
      updateProxy({
        ...httpProxy,
        ...httpPayload,
      })
        .then((response) => {
          formikHelpers.setSubmitting(false);
        })
        .catch((error) => {
          formikHelpers.setSubmitting(false);
          setError(error);
        });
    }

    if (httpsProxy && httpsValuesHaveUpdate(formValues, httpsProxy)) {
      updateProxy({
        ...httpsProxy,
        ...httpsPayload,
      })
        .then((response) => {
          formikHelpers.setSubmitting(false);
        })
        .catch((error) => {
          formikHelpers.setSubmitting(false);
          setError(error);
        });
    }
  };

  const httpIdentityInitialValue = useMemo(() => {
    let result: IdentityDropdown | null = null;
    if (httpProxy && identities && identities.data) {
      const identityId = Number(httpProxy.identity);
      const identity = identities.data.find((i) => i.id === identityId);

      if (identity) {
        result = toIdentityDropdown({
          id: identityId,
          name: identity.name,
        });
      }
    }
    return result;
  }, [identities, httpProxy]);

  const httpsIdentityInitialValue = useMemo(() => {
    let result: IdentityDropdown | null = null;
    if (httpsProxy && identities && identities.data) {
      const identityId = Number(httpsProxy.identity);
      const identity = identities.data.find((i) => i.id === identityId);

      if (identity) {
        result = toIdentityDropdown({
          id: identityId,
          name: identity.name,
        });
      }
    }
    return result;
  }, [identities, httpProxy]);

  const initialValues: FormValues = {
    [HTTP_HOST]: httpProxy?.host || "",
    [HTTP_PORT]: httpProxy?.port || 8080,
    [HTTP_IDENTITY]: httpIdentityInitialValue,
    [IS_HTTP_CHECKED]: !!httpProxy || false,
    [HTTPS_HOST]: httpsProxy?.host || "",
    [HTTPS_PORT]: httpsProxy?.port || 8080,
    [HTTPS_IDENTITY]: httpsIdentityInitialValue,
    [IS_HTTPS_CHECKED]: !!httpsProxy || false,
    [EXCLUDED]: httpProxy?.excluded.join(",") || "",
  };

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: initialValues,
    validationSchema: validationSchema({
      [HTTP_HOST]: isHttpProxy,
      [HTTP_PORT]: isHttpProxy,
      [HTTP_IDENTITY]: isHttpIdentityRequired,
      [HTTPS_HOST]: isHttpsProxy,
      [HTTPS_PORT]: isHttpsProxy,
      [HTTPS_IDENTITY]: isHttpIdentityRequired,
    }),
    onSubmit: onSubmit,
  });

  const onChangeIsHttpsIdentityRequired = () => {
    setIsHttpsIdentityRequired(!isHttpsIdentityRequired);
  };

  const onChangeIsHttpIdentityRequired = () => {
    setIsHttpIdentityRequired(!isHttpIdentityRequired);
  };

  const onChangeField = (value: string, event: React.FormEvent<any>) => {
    formik.handleChange(event);
  };

  const handleDeleteProxy = () => {
    let httpPromise: AxiosPromise<Proxy>;
    const emptyHttpPayload: Proxy = {
      kind: "http",
      excluded: [],
      host: "",
      identity: 0,
      port: 0,
    };
    const emptyHttpsPayload: Proxy = {
      kind: "https",
      excluded: [],
      host: "",
      identity: 0,
      port: 0,
    };
    if (httpProxy?.id || httpsProxy?.id) {
      httpPromise = updateProxy({
        ...httpProxy,
        ...emptyHttpPayload,
      });
      httpPromise
        .then((response) => {
          formik.resetForm();
          onDelete();
        })
        .catch((error) => {
          setError(error);
        });

      let httpsPromise: AxiosPromise<Proxy>;
      httpsPromise = updateProxy({
        ...httpsProxy,
        ...emptyHttpsPayload,
      });
      httpsPromise
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
        <Switch
          id="httpProxy"
          className="proxy"
          label="HTTP proxy"
          aria-label="HTTP Proxy"
          isChecked={isHttpProxy}
          onChange={onChangeIsHttpProxy}
        />

        {isHttpProxy && (
          <div className={spacing.mlLg}>
            <FormGroup
              label="HTTP proxy host"
              fieldId="httpHost"
              isRequired={true}
              className={spacing.mMd}
              validated={getValidatedFromError(formik.errors.httpHost)}
              helperTextInvalid={formik.errors.httpHost}
            >
              <TextInput
                type="text"
                name={HTTP_HOST}
                aria-label="httphost"
                aria-describedby="httphost"
                isRequired={true}
                onChange={onChangeField}
                onBlur={formik.handleBlur}
                value={formik.values.httpHost}
                validated={getValidatedFromErrorTouched(
                  formik.errors.httpHost,
                  formik.touched.httpHost
                )}
              />
            </FormGroup>
            <FormGroup
              label="HTTP proxy port"
              fieldId="port"
              className={spacing.mMd}
              isRequired={true}
              validated={getValidatedFromError(formik.errors.httpPort)}
              helperTextInvalid={formik.errors.httpPort}
            >
              <TextInput
                type="number"
                name={HTTP_PORT}
                aria-label="httpport"
                aria-describedby="httpport"
                isRequired={true}
                onChange={onChangeField}
                onBlur={formik.handleBlur}
                value={formik.values.httpPort}
                validated={getValidatedFromErrorTouched(
                  formik.errors.httpPort,
                  formik.touched.httpPort
                )}
              />
            </FormGroup>
            <Switch
              id="http-identity-required"
              className={spacing.mMd}
              label="HTTP proxy credentials"
              aria-label="http identity required"
              isChecked={isHttpIdentityRequired}
              onChange={onChangeIsHttpIdentityRequired}
            />
            {isHttpIdentityRequired && (
              <FormGroup
                label="HTTP proxy credentials"
                className={spacing.mMd}
                fieldId={HTTP_IDENTITY}
                isRequired={isHttpIdentityRequired}
                validated={getValidatedFromErrorTouched(
                  formik.errors.httpIdentity,
                  formik.touched.httpIdentity
                )}
                helperTextInvalid={formik.errors.httpIdentity}
              >
                <SingleSelectFetchOptionValueFormikField
                  fieldConfig={{ name: HTTP_IDENTITY }}
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
          </div>
        )}
        <Switch
          id="httpsProxy"
          label="HTTPS proxy"
          aria-label="HTTPS Proxy"
          isChecked={isHttpsProxy}
          onChange={onChangeIsHttpsProxy}
        />

        {isHttpsProxy && (
          <>
            <FormGroup
              label="HTTPS proxy host"
              className={spacing.mMd}
              fieldId="httpsHost"
              isRequired={true}
              validated={getValidatedFromError(formik.errors.httpsHost)}
              helperTextInvalid={formik.errors.httpsHost}
            >
              <TextInput
                type="text"
                name={HTTPS_HOST}
                aria-label="httpshost"
                aria-describedby="httpshost"
                isRequired={true}
                onChange={onChangeField}
                onBlur={formik.handleBlur}
                value={formik.values.httpsHost}
                validated={getValidatedFromErrorTouched(
                  formik.errors.httpsHost,
                  formik.touched.httpsHost
                )}
              />
            </FormGroup>
            <FormGroup
              label="HTTPS proxy port"
              className={spacing.mMd}
              fieldId="port"
              isRequired={true}
              validated={getValidatedFromError(formik.errors.httpsPort)}
              helperTextInvalid={formik.errors.httpsPort}
            >
              <TextInput
                type="number"
                name={HTTPS_PORT}
                aria-label="httpsport"
                aria-describedby="httpsport"
                isRequired={true}
                onChange={onChangeField}
                onBlur={formik.handleBlur}
                value={formik.values.httpsPort}
                validated={getValidatedFromErrorTouched(
                  formik.errors.httpsPort,
                  formik.touched.httpsPort
                )}
              />
            </FormGroup>
            <Switch
              id="https-identity-required"
              className={spacing.mMd}
              label="HTTPS proxy credentials"
              aria-label="httpS identity required"
              isChecked={isHttpsIdentityRequired}
              onChange={onChangeIsHttpsIdentityRequired}
            />
            {isHttpsIdentityRequired && (
              <FormGroup
                label="HTTPS proxy credentials"
                className={spacing.mMd}
                fieldId={HTTPS_IDENTITY}
                isRequired={isHttpsIdentityRequired}
                validated={getValidatedFromErrorTouched(
                  formik.errors.httpsIdentity,
                  formik.touched.httpsIdentity
                )}
                helperTextInvalid={formik.errors.httpsIdentity}
              >
                <SingleSelectFetchOptionValueFormikField
                  fieldConfig={{ name: HTTPS_IDENTITY }}
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
            <FormGroup
              label="Excluded"
              fieldId="excluded"
              isRequired={false}
              validated={getValidatedFromError(formik.errors.excluded)}
              helperTextInvalid={formik.errors.excluded}
            >
              <TextArea
                type="text"
                name="excluded"
                aria-label="excluded"
                aria-describedby="excluded"
                isRequired={false}
                onChange={onChangeField}
                onBlur={formik.handleBlur}
                value={formik.values.excluded}
                validated={getValidatedFromErrorTouched(
                  formik.errors.excluded,
                  formik.touched.excluded
                )}
              />
            </FormGroup>
          </>
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
            {httpValuesHaveUpdate(formik.values, httpProxy) ||
            httpsValuesHaveUpdate(formik.values, httpsProxy)
              ? "Save"
              : "Update"}
          </Button>
          <Button variant={ButtonVariant.secondary} onClick={handleDeleteProxy}>
            Clear
            {/* {httpValuesHaveUpdate(formik.values, httpProxy) ||
              (httpsValuesHaveUpdate(formik.values, httpsProxy) && "Clear")} */}
          </Button>
        </ActionGroup>
      </Form>
    </FormikProvider>
  );
};
