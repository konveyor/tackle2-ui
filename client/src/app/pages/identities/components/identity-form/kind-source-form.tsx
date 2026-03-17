import { useState } from "react";
import * as React from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { Trans, useTranslation } from "react-i18next";
import { Alert, FileUpload, Switch } from "@patternfly/react-core";

import { Identity, IdentityKind } from "@app/api/models";
import SimpleSelect from "@app/components/FilterToolbar/components/SimpleSelect";
import {
  HookFormPFGroupController,
  HookFormPFTextInput,
} from "@app/components/HookFormPFFields";
import KeyDisplayToggle from "@app/components/KeyDisplayToggle";

import { KindSimpleUsernamePasswordForm } from "./kind-simple-username-password-form";

const USER_CREDENTIALS_OPTIONS = [
  { value: "userpass", label: "Username/Password" },
  { value: "source", label: "Source Private Key/Passphrase" },
];

export const KindSourceForm: React.FC<{
  identity?: Identity;
  defaultIdentities?: Record<IdentityKind, Identity | undefined>;
}> = ({ identity, defaultIdentities }) => {
  const { t } = useTranslation();
  const { control, setValue, resetField } = useFormContext();
  const [userCredentials, password, key, kind, isDefault, keyFilename] =
    useWatch({
      control,
      name: [
        "userCredentials",
        "password",
        "key",
        "kind",
        "default",
        "keyFilename",
      ],
    });

  const [isKeyFileRejected, setIsKeyFileRejected] = useState(false);

  const [isPasswordHidden, setIsPasswordHidden] = useState(true);
  const toggleHidePassword = (e: React.FormEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPasswordHidden(!isPasswordHidden);
  };

  const isPasswordEncrypted = identity?.password === password;
  const isKeyEncrypted = identity?.key === key;
  const kindDefault = defaultIdentities?.[kind as IdentityKind];
  const isReplacingDefault =
    isDefault && kindDefault && (!identity || kindDefault.id !== identity.id);

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
            isScrollable
            isFullWidth
            id="user-credentials-select"
            toggleId="user-credentials-select-toggle"
            toggleAriaLabel="User credentials select dropdown toggle"
            ariaLabel={name}
            value={value ?? undefined}
            options={USER_CREDENTIALS_OPTIONS}
            onSelect={(selection) => {
              onChange(selection);
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

      {userCredentials === "userpass" && (
        <KindSimpleUsernamePasswordForm
          identity={identity}
          usernameLabel="Username"
          passwordLabel="Password"
        />
      )}

      {userCredentials === "source" && (
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
                filename={keyFilename}
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
