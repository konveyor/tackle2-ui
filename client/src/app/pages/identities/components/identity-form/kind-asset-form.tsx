import React, { useState } from "react";
import { FileUpload } from "@patternfly/react-core";
import { useFormContext, useWatch } from "react-hook-form";

import { OptionWithValue, SimpleSelect } from "@app/components/SimpleSelect";
import { Identity } from "@app/api/models";
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
    toString: () => `Private Key/Passphrase`,
  },
];

export const KindAssetForm: React.FC<{
  identity?: Identity;
}> = ({ identity }) => {
  const { control, setValue, resetField } = useFormContext();
  const [password, key, userCredentials, keyFilename] = useWatch({
    control,
    name: ["password", "key", "userCredentials", "keyFilename"],
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
              resetField("user");
              resetField("password");
              resetField("key");
              resetField("keyFilename");
            }}
          />
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
            label="Upload your Private Key file or paste its contents below."
            isRequired
            renderInput={({ field: { onChange, value, name } }) => (
              <FileUpload
                data-testid="asset-key-upload"
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
