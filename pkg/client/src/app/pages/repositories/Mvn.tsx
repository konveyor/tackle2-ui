import * as React from "react";
import {
  Button,
  Card,
  CardBody,
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
import { Setting } from "@app/api/models";
import { getSettingById, updateSetting } from "@app/api/rest";
import { useFetch } from "@app/shared/hooks/useFetch";
import { useEffect } from "react";

export const RepositoriesMvn: React.FunctionComponent = () => {
  const { t } = useTranslation();
  const [error, setError] = React.useState<AxiosError>();

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
        setError(error);
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
        setError(error);
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

  return (
    <>
      <PageSection variant={PageSectionVariants.light}>
        <TextContent>
          <Text component="h1">{t("terms.mavenConfig")}</Text>
        </TextContent>
      </PageSection>
      <PageSection>
        <Card>
          {/* <CardBody>
            <TextInput
              value={"value"}
              className="repo"
              type="text"
              aria-label="Maven Repository Size"
              isReadOnly
            />
            {"  "}
            <Button variant="link" isInline>
              Clear repository
            </Button>
          </CardBody> */}
          <CardBody>
            <Switch
              id="maven-update"
              className="repo"
              label="Force update of depencies"
              aria-label="Force update of Maven repositories"
              isChecked={mvnForcedSetting === true ? true : false}
              onChange={onChangeForced}
            />
          </CardBody>
          <CardBody>
            <Switch
              id="maven-secure"
              className="repo"
              label="Consume insecure Maven repositories"
              aria-label="Insecure Maven repositories"
              isChecked={mvnInsecureSetting === true ? true : false}
              onChange={onChangeInsecure}
            />
          </CardBody>
        </Card>
      </PageSection>
    </>
  );
};
