import React, { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Trans, useTranslation } from "react-i18next";
import { Alert, FileUpload, Switch } from "@patternfly/react-core";

import { Identity, IdentityKind } from "@app/api/models";
import { HookFormPFGroupController } from "@app/components/HookFormPFFields";

export const KindMavenSettingsFileForm: React.FC<{
  identity?: Identity;
  defaultIdentities?: Record<IdentityKind, Identity | undefined>;
}> = ({ identity, defaultIdentities }) => {
  const { t } = useTranslation();
  const { control, getValues, setValue } = useFormContext();
  const values = getValues();

  const [isLoading, setIsLoading] = useState(false);
  const [isSettingsFileRejected, setIsSettingsFileRejected] = useState(false);

  const isSettingsEncrypted = identity?.settings === values.settings;
  const kindDefault = defaultIdentities?.[values.kind as IdentityKind];
  const isReplacingDefault =
    values.default &&
    kindDefault &&
    (!identity || kindDefault.id !== identity.id);

  return (
    <>
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
                  i18nKey="credentials.default.mavenChangeWarning"
                  values={{
                    name: kindDefault.name,
                  }}
                />
              </Alert>
            )}
          </>
        )}
      />
      <HookFormPFGroupController
        control={control}
        name="settings"
        fieldId="settings"
        label="Upload your Settings file or paste its contents below."
        isRequired={values.kind === "maven"}
        errorsSuppressed={isLoading}
        renderInput={({ field: { onChange, value, name } }) => (
          <FileUpload
            data-testid="maven-settings-upload"
            id="settings"
            name={name}
            type="text"
            value={isSettingsEncrypted ? "[Encrypted]" : (value ?? "")}
            filename={values.settingsFilename}
            filenamePlaceholder="Drag and drop a file or upload one"
            dropzoneProps={{
              accept: { "text/xml": [".xml"] },
              onDropRejected: () => setIsSettingsFileRejected(true),
            }}
            validated={isSettingsFileRejected ? "error" : "default"}
            onFileInputChange={(_, file) => {
              setValue("settingsFilename", file?.name ?? "");
              setIsSettingsFileRejected(false);
            }}
            onDataChange={(_, value: string) => {
              onChange(value);
            }}
            onTextChange={(_, value: string) => {
              onChange(value);
            }}
            onClearClick={() => {
              onChange("");
              setValue("settingsFilename", "");
              setIsSettingsFileRejected(false);
            }}
            onReadStarted={() => setIsLoading(true)}
            onReadFinished={() => setIsLoading(false)}
            isLoading={isLoading}
            allowEditingUploadedText
            browseButtonText="Upload"
          />
        )}
      />
    </>
  );
};
