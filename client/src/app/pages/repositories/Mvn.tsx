import * as React from "react";
import {
  Alert,
  Button,
  ButtonVariant,
  Card,
  CardBody,
  Form,
  FormGroup,
  PageSection,
  PageSectionVariants,
  Switch,
  Text,
  TextContent,
  TextInput,
  Tooltip,
} from "@patternfly/react-core";
import { useTranslation } from "react-i18next";

import "./Repositories.css";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import { Setting, SettingBoolean } from "@app/api/models";
import { useEffect, useState } from "react";
import { useDeleteCacheMutation, useFetchCache } from "@app/queries/cache";
import { ConfirmDialog } from "@app/shared/components";
import { isRWXSupported } from "@app/Constants";
import { ConditionalTooltip } from "@app/shared/components/ConditionalTooltip";
import { useSetting, useSettingMutation } from "@app/queries/settings";

export const RepositoriesMvn: React.FC = () => {
  const { t } = useTranslation();

  const [isConfirmDialogOpen, setIsConfirmDialogOpen] =
    React.useState<Boolean>(false);

  const mvnInsecureSetting = useSetting("mvn.insecure.enabled");
  const settingMutationQuery = useSettingMutation();

  const onChangeInsecure = () => {
    if (mvnInsecureSetting.isSuccess) {
      const setting: SettingBoolean = {
        key: "mvn.insecure.enabled",
        value: !mvnInsecureSetting.data as boolean,
      };

      settingMutationQuery.mutate(setting);
    }
  };

  // TODO: Implement mvn forced setting
  // const mvnForcedSetting = useSetting("mvn.dependencies.update.forced");
  //
  // const onChangeForced = () => {
  //   if (mvnForcedSetting.isSuccess) {
  //     const setting: Setting = {
  //       key: "mvn.dependencies.update.forced",
  //       value: (!mvnForcedSetting.data as boolean).toString(),
  //     };
  //
  //     settingMutationQuery.mutate(setting);
  //   }
  // };

  const [storageValue, setStorageValue] = useState<string>();

  const { cache, refetch, isFetching } = useFetchCache();
  useEffect(() => {
    if (cache) {
      setStorageValue(`${cache.used} of ${cache.capacity} `);
    }
  }, [cache]);

  const onHandleCleanSuccess = () => {
    refetch();
  };
  const onHandleCleanError = () => {
    refetch();
  };

  const { mutate: deleteCache, isLoading: isDeleting } = useDeleteCacheMutation(
    onHandleCleanSuccess,
    onHandleCleanError
  );

  return (
    <>
      <PageSection variant={PageSectionVariants.light}>
        <TextContent>
          <Text component="h1">{t("terms.mavenConfig")}</Text>
        </TextContent>
      </PageSection>
      <PageSection>
        <Card>
          <CardBody>
            <Form>
              <FormGroup label="Local artifact repository" fieldId="name">
                <TextInput
                  value={storageValue}
                  className="repo"
                  type="text"
                  aria-label="Maven Repository Size"
                  aria-disabled={!isRWXSupported || isFetching || isDeleting}
                  isDisabled={!isRWXSupported || isFetching || isDeleting}
                  readOnlyVariant="default"
                  size={15}
                  width={10}
                />
                <ConditionalTooltip
                  isTooltipEnabled={!isRWXSupported}
                  content={t("actions.clearRepositoryNotSupported")}
                >
                  <Button
                    id="clear-repository"
                    isInline
                    className={spacing.mlMd}
                    isAriaDisabled={!isRWXSupported || isFetching || isDeleting}
                    onClick={() => setIsConfirmDialogOpen(true)}
                  >
                    Clear repository
                  </Button>
                </ConditionalTooltip>
              </FormGroup>
              <FormGroup fieldId="isInsecure">
                {mvnInsecureSetting.isError && (
                  <Alert
                    variant="danger"
                    isInline
                    title={mvnInsecureSetting.error}
                  />
                )}
                <Tooltip
                  content={`Enabling this option allows repositories using the "http" protocol to be consumed. The default is to require https.`}
                >
                  <Switch
                    id="maven-secure"
                    className="repo"
                    label="Consume insecure Maven repositories"
                    aria-label="Insecure Maven repositories"
                    isChecked={
                      mvnInsecureSetting.isSuccess
                        ? (mvnInsecureSetting.data as boolean)
                        : false
                    }
                    onChange={onChangeInsecure}
                  />
                </Tooltip>
              </FormGroup>
            </Form>
          </CardBody>
        </Card>
      </PageSection>
      {isConfirmDialogOpen && (
        <ConfirmDialog
          title={"Clear repository"}
          titleIconVariant={"warning"}
          message="This will clear the local Maven repository and considerably slow down builds until dependencies are collected again. Do you wish to continue?"
          isOpen={true}
          confirmBtnVariant={ButtonVariant.primary}
          confirmBtnLabel={t("actions.continue")}
          cancelBtnLabel={t("actions.cancel")}
          onCancel={() => setIsConfirmDialogOpen(false)}
          onClose={() => setIsConfirmDialogOpen(false)}
          onConfirm={() => {
            deleteCache();
            setIsConfirmDialogOpen(false);
          }}
        />
      )}
    </>
  );
};
