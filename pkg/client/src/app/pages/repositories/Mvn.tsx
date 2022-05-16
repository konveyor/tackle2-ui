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
import { AxiosError, AxiosPromise } from "axios";
import { Setting, Volume } from "@app/api/models";
import { getSettingById, updateSetting } from "@app/api/rest";
import { useFetch } from "@app/shared/hooks/useFetch";
import { useEffect, useState } from "react";
import { getAxiosErrorMessage } from "@app/utils/utils";
import {
  useCleanRepositoryMutation,
  useFetchVolumes,
} from "@app/queries/volumes";
import { useFetchTasks } from "@app/queries/tasks";
import { useDispatch } from "react-redux";
import { confirmDialogActions } from "@app/store/confirmDialog";

export const RepositoriesMvn: React.FunctionComponent = () => {
  const { t } = useTranslation();
  // Redux
  const dispatch = useDispatch();

  const [forcedSettingError, setForcedSettingError] =
    React.useState<AxiosError>();
  const [insecureSettingError, setInsecureSettingError] =
    React.useState<AxiosError>();

  const onChangeInsecure = () => {
    const setting: Setting = {
      key: "mvn.insecure.enabled",
      value: !mvnInsecureSetting,
    };

    let promise: AxiosPromise<Setting>;
    if (mvnInsecureSetting !== undefined) {
      promise = updateSetting(setting);
    } else {
      promise = updateSetting(setting);
    }

    promise
      .then((response) => {
        refreshMvnInsecureSetting();
      })
      .catch((error) => {
        setInsecureSettingError(error);
      });
  };

  const onChangeForced = () => {
    const setting: Setting = {
      key: "mvn.dependencies.update.forced",
      value: !mvnForcedSetting,
    };

    let promise: AxiosPromise<Setting>;
    if (mvnInsecureSetting !== undefined) {
      promise = updateSetting(setting);
    } else {
      promise = updateSetting(setting);
    }

    promise
      .then((response) => {
        refreshMvnForcedSetting();
      })
      .catch((error) => {
        setForcedSettingError(error);
      });
  };

  const fetchMvnForcedSetting = React.useCallback(() => {
    return getSettingById("mvn.dependencies.update.forced");
  }, []);

  const fetchMvnInsecureSetting = React.useCallback(() => {
    return getSettingById("mvn.insecure.enabled");
  }, []);

  const { data: mvnInsecureSetting, requestFetch: refreshMvnInsecureSetting } =
    useFetch<boolean>({
      defaultIsFetching: true,
      onFetch: fetchMvnInsecureSetting,
    });

  const { data: mvnForcedSetting, requestFetch: refreshMvnForcedSetting } =
    useFetch<boolean>({
      defaultIsFetching: true,
      onFetch: fetchMvnForcedSetting,
    });

  useEffect(() => {
    refreshMvnInsecureSetting();
  }, [refreshMvnInsecureSetting]);

  useEffect(() => {
    refreshMvnForcedSetting();
  }, [refreshMvnForcedSetting]);

  const { volumes, refetch } = useFetchVolumes();
  const { tasks } = useFetchTasks();
  const [storageValue, setStorageValue] = useState<string>();
  const [currCleanId, setCurrCleanId] = useState<number>(0);

  useEffect(() => {
    const thisVol = volumes.find((vol) => vol.name === "m2");
    if (thisVol) {
      setStorageValue(`${thisVol.used} of ${thisVol.capacity} `);
    }
    setCurrCleanId(thisVol?.id || 0);
  }, [volumes, currCleanId]);
  const onHandleCleanSuccess = () => {
    refetch();
  };
  const onHandleCleanError = () => {
    refetch();
  };

  const { mutate: cleanRepository, isCleaning } = useCleanRepositoryMutation({
    onSuccess: onHandleCleanSuccess,
    onError: onHandleCleanError,
  });

  const confirmClean = () => {
    dispatch(
      confirmDialogActions.openDialog({
        title: "Clear repository",
        message:
          "This will clear the local Maven repository and considerably slow down builds until dependencies are collected again. Do you wish to continue?",
        confirmBtnVariant: ButtonVariant.primary,
        confirmBtnLabel: t("actions.continue"),
        cancelBtnLabel: t("actions.cancel"),
        onConfirm: () => {
          dispatch(confirmDialogActions.closeDialog());
          if (currCleanId) {
            const cleanIdStr = currCleanId.toString();
            cleanRepository(cleanIdStr);
          }
        },
      })
    );
  };

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
                  isReadOnly
                  size={15}
                  width={10}
                />
                {"  "}
                <Button
                  variant="link"
                  isInline
                  isDisabled={isCleaning}
                  onClick={() => {
                    confirmClean();
                  }}
                >
                  Clear repository
                </Button>
                {forcedSettingError && (
                  <Alert
                    variant="danger"
                    isInline
                    title={getAxiosErrorMessage(forcedSettingError)}
                  />
                )}
              </FormGroup>
              <FormGroup fieldId="isForcedUpdate">
                <Tooltip content="Enabling this option forces a download of remote dependencies to the local artifact repository at each build.">
                  <Switch
                    id="maven-update"
                    label="Force update of dependencies"
                    aria-label="Force update of Maven repositories"
                    isChecked={mvnForcedSetting === true ? true : false}
                    onChange={onChangeForced}
                  />
                </Tooltip>
              </FormGroup>
              <FormGroup fieldId="isInsecure">
                {insecureSettingError && (
                  <Alert
                    variant="danger"
                    isInline
                    title={getAxiosErrorMessage(insecureSettingError)}
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
                    isChecked={mvnInsecureSetting === true ? true : false}
                    onChange={onChangeInsecure}
                  />
                </Tooltip>
              </FormGroup>
            </Form>
          </CardBody>
        </Card>
      </PageSection>
    </>
  );
};
