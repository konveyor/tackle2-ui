import * as React from "react";
import {
  Alert,
  Button,
  ButtonVariant,
  Card,
  CardBody,
  Form,
  FormGroup,
  Grid,
  GridItem,
  PageSection,
  PageSectionVariants,
  Spinner,
  Switch,
  Text,
  TextContent,
  TextInput,
  Tooltip,
} from "@patternfly/react-core";
import { useTranslation } from "react-i18next";

import "./Repositories.css";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import { useDeleteCacheMutation, useFetchCache } from "@app/queries/cache";
import { ConfirmDialog } from "@app/components/ConfirmDialog";
import { isRWXSupported } from "@app/Constants";
import { ConditionalTooltip } from "@app/components/ConditionalTooltip";
import { useSetting, useSettingMutation } from "@app/queries/settings";

export const RepositoriesMvn: React.FC = () => {
  const { t } = useTranslation();

  const [isConfirmDialogOpen, setIsConfirmDialogOpen] =
    React.useState<boolean>(false);

  const mvnInsecureSetting = useSetting("mvn.insecure.enabled");
  const mvnInsecureSettingMutation = useSettingMutation("mvn.insecure.enabled");

  const onChangeInsecure = () => {
    if (mvnInsecureSetting.isSuccess)
      mvnInsecureSettingMutation.mutate(!mvnInsecureSetting.data);
  };

  // TODO: Implement mvn forced setting
  // const mvnForcedSetting = useSetting("mvn.dependencies.update.forced");
  // const mvnForcedSettingMutation = useSettingMutation("mvn.insecure.enabled");

  // const onChangeForced = () => {
  //   if (mvnForcedSetting.isSuccess)
  //     mvnForcedSettingMutation.mutate(!mvnForcedSetting.data);
  // };

  const { data: cache, isFetching, isSuccess, refetch } = useFetchCache();

  const cacheUseString = React.useMemo(() => {
    return isSuccess ? `${cache.used} of ${cache.capacity} ` : "";
  }, [cache, isSuccess]);

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

  const inputDisabled = !isRWXSupported || isFetching || isDeleting;

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
                <Grid>
                  <GridItem span={5}>
                    <TextInput
                      value={isFetching ? "" : cacheUseString}
                      type="text"
                      aria-label="Maven Repository Size"
                      aria-disabled={inputDisabled}
                      isDisabled={inputDisabled}
                      readOnlyVariant="default"
                      size={15}
                      width={20}
                    />
                  </GridItem>
                  <GridItem span={7}>
                    <ConditionalTooltip
                      isTooltipEnabled={!isRWXSupported}
                      content={t("actions.clearRepositoryNotSupported")}
                    >
                      <Button
                        id="clear-repository"
                        isInline
                        className={spacing.mlMd}
                        isAriaDisabled={inputDisabled}
                        onClick={() => setIsConfirmDialogOpen(true)}
                      >
                        {isFetching ? (
                          <Text>
                            Loading...
                            <Spinner
                              className={spacing.mlMd}
                              isInline
                              aria-label="Spinner of clear repository button"
                            />
                          </Text>
                        ) : (
                          "Clear repository"
                        )}
                      </Button>
                    </ConditionalTooltip>
                  </GridItem>
                </Grid>
              </FormGroup>

              <FormGroup fieldId="isInsecure">
                {mvnInsecureSetting.isError && (
                  <Alert
                    variant="danger"
                    isInline
                    title={mvnInsecureSetting.error as string}
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
                        ? mvnInsecureSetting.data
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
