import React, { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Alert, FileUpload, Switch } from "@patternfly/react-core";
import { useFormContext, useWatch } from "react-hook-form";

import { OptionWithValue, SimpleSelect } from "@app/components/SimpleSelect";
import { Identity, IdentityKind } from "@app/api/models";
import { toOptionLike } from "@app/utils/model-utils";
import KeyDisplayToggle from "@app/components/KeyDisplayToggle";
import {
  HookFormPFGroupController,
  HookFormPFTextInput,
} from "@app/components/HookFormPFFields";
import { UserCredentials } from "./identity-form";
import { KindSimpleUsernamePasswordForm } from "./kind-simple-username-password-form";

const USER_CREDENTIALS_OPTIONS: OptionWithValue<UserCredentials>[] = [
  {
    value: "userpass",
    toString: () => `Username/Password`,
  },
  {
    value: "source",
    toString: () => `Source Private Key/Passphrase`,
  },
];

export const KindSourceForm: React.FC<{
  identity?: Identity;
  defaultIdentities?: Record<IdentityKind, Identity | undefined>;
}> = ({ identity, defaultIdentities }) => {
  const { t } = useTranslation();
  const { control, setValue, resetField } = useFormContext();
  const values = useWatch({ control });

  const [isKeyFileRejected, setIsKeyFileRejected] = useState(false);

  const [isPasswordHidden, setIsPasswordHidden] = useState(true);
  const toggleHidePassword = (e: React.FormEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPasswordHidden(!isPasswordHidden);
  };

  const isPasswordEncrypted = identity?.password === values.password;
  const isKeyEncrypted = identity?.key === values.key;
  const kindDefault = defaultIdentities?.[values.kind as IdentityKind];
  const isReplacingDefault =
    values.default &&
    kindDefault &&
    (!identity || kindDefault.id !== identity.id);

  return (
    <>
      <HookFormPFGroupController
        control={control}
        name="userCredentials"
        label="User credentials"
        isRequired
        fieldId="user-credentials-select"
        renderInput={({ field: { value, name, onChange } }) => (
          <SimpleSelect
            id="user-credentials-select"
            toggleId="user-credentials-select-toggle"
            toggleAriaLabel="User credentials select dropdown toggle"
            aria-label={name}
            value={
              value ? toOptionLike(value, USER_CREDENTIALS_OPTIONS) : undefined
            }
            options={USER_CREDENTIALS_OPTIONS}
            onChange={(selection) => {
              const selectionValue =
                selection as OptionWithValue<UserCredentials>;
              onChange(selectionValue.value);
              // So we don't retain the values from the wrong type of credential
              resetField("default");
              resetField("user");
              resetField("key");
              resetField("password");
            }}
          />
        )}
      />
      <HookFormPFGroupController
        control={control}
        name="default"
        fieldId="default"
        label="Default credential?"
        renderInput={({ field: { onChange, value, name, ref } }) => (
          <>
            <Switch
              id="default"
              name={name}
              label={t("credentials.default.sourceSwitchLabel")}
              isChecked={value}
              onChange={(_, checked) => onChange(checked)}
              ref={ref}
            />
            {isReplacingDefault && (
              <Alert
                isInline
                className="alert-replacing-default"
                variant="warning"
                title={t("credentials.default.changeTitle")}
              >
                <Trans
                  i18nKey="credentials.default.sourceChangeWarning"
                  values={{
                    name: kindDefault.name,
                  }}
                />
              </Alert>
            )}
          </>
        )}
      />

      {values?.userCredentials === "userpass" && (
        <KindSimpleUsernamePasswordForm
          identity={identity}
          usernameLabel="Username"
          passwordLabel="Password"
        />
      )}

      {values?.userCredentials === "source" && (
        <>
          <HookFormPFGroupController
            control={control}
            name="key"
            fieldId="key"
            label="Upload your [SCM Private Key] file or paste its contents below."
            isRequired
            renderInput={({ field: { onChange, value, name } }) => (
              <FileUpload
                data-testid="source-key-upload"
                id="key"
                name={name}
                type="text"
                value={isKeyEncrypted ? "[Encrypted]" : (value ?? "")}
                filename={values.keyFilename}
                filenamePlaceholder="Drag and drop a file or upload one"
                dropzoneProps={{
                  onDropRejected: () => setIsKeyFileRejected(true),
                }}
                validated={isKeyFileRejected ? "error" : "default"}
                onFileInputChange={(_, file) => {
                  setValue("keyFilename", file?.name ?? "");
                  setIsKeyFileRejected(false);
                }}
                onDataChange={(_, value: string) => {
                  onChange(value);
                }}
                onTextChange={(_, value: string) => {
                  onChange(value);
                }}
                onClearClick={() => {
                  onChange("");
                  setValue("keyFilename", "");
                  setIsKeyFileRejected(false);
                }}
                allowEditingUploadedText
                browseButtonText="Upload"
              />
            )}
          />
          <HookFormPFTextInput
            control={control}
            name="password"
            fieldId="password"
            label="Private Key Passphrase"
            type={isPasswordHidden ? "password" : "text"}
            formGroupProps={{
              labelIcon: !isPasswordEncrypted ? (
                <KeyDisplayToggle
                  keyName="password"
                  isKeyHidden={isPasswordHidden}
                  onClick={toggleHidePassword}
                />
              ) : undefined,
            }}
            onFocus={() => resetField("password")}
          />
        </>
      )}
    </>
  );
};
