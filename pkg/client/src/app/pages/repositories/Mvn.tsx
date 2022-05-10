import * as React from "react";
import {
  Alert,
  Button,
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

export const RepositoriesMvn: React.FunctionComponent = () => {
  const { t } = useTranslation();
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

  const { volumes } = useFetchVolumes();
  const [storageValue, setStorageValue] = useState<string>();
  const [currCleanId, setCurrCleanId] = useState<number>(0);
  const [isCleanDisabled, setIsCleanDisabled] = useState<boolean>(true);

  useEffect(() => {
    const thisVol = volumes.find((vol) => vol.name === "m2");
    if (thisVol) {
      setStorageValue(`${thisVol.used} of ${thisVol.capacity} `);
    }
    setCurrCleanId(thisVol?.id || 0);
  }, [volumes, currCleanId]);
  const onHandleCleanSuccess = (res: any) => {};
  const onHandleCleanError = (err: AxiosError) => {};
  const {
    mutate: cleanRepository,
    isLoading,
    error,
  } = useCleanRepositoryMutation(onHandleCleanSuccess, onHandleCleanError);

  const disableUntilRefocus = () => {
    if (!isCleanDisabled) {
      setIsCleanDisabled(true);
    }
  };
  useEffect(() => {
    setIsCleanDisabled(false);

    return () => {
      setIsCleanDisabled(false);
    };
  }, []);

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
                  isDisabled={isCleanDisabled}
                  onClick={() => {
                    cleanRepository(currCleanId || 0);
                    disableUntilRefocus();
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
              <Switch
                id="maven-update"
                className="repo"
                label="Force update of dependencies"
                aria-label="Force update of Maven repositories"
                isChecked={mvnForcedSetting === true ? true : false}
                onChange={onChangeForced}
              />
              {insecureSettingError && (
                <Alert
                  variant="danger"
                  isInline
                  title={getAxiosErrorMessage(insecureSettingError)}
                />
              )}
              <Switch
                id="maven-secure"
                className="repo"
                label="Consume insecure Maven repositories"
                aria-label="Insecure Maven repositories"
                isChecked={mvnInsecureSetting === true ? true : false}
                onChange={onChangeInsecure}
              />
            </Form>
          </CardBody>
        </Card>
      </PageSection>
    </>
  );
};
