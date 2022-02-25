import * as React from "react";
import {
  Alert,
  Card,
  CardBody,
  PageSection,
  PageSectionVariants,
  Switch,
  Text,
  TextContent,
} from "@patternfly/react-core";
import { useTranslation } from "react-i18next";

import "./Repositories.css";
import { useCallback, useEffect } from "react";
import { getSettingById, updateSetting } from "@app/api/rest";
import { useFetch } from "@app/shared/hooks";
import { Setting } from "@app/api/models";
import { AxiosError, AxiosPromise } from "axios";
import { getAxiosErrorMessage } from "@app/utils/utils";

export const RepositoriesGit: React.FunctionComponent = () => {
  const { t } = useTranslation();
  const [error, setError] = React.useState<AxiosError>();

  const onChange = () => {
    const setting: Setting = {
      key: "git.insecure.enabled",
      value: !gitInsecureSetting,
    };

    let promise: AxiosPromise<Setting>;
    if (gitInsecureSetting !== undefined) {
      promise = updateSetting(setting);
    } else {
      promise = updateSetting(setting);
    }

    promise
      .then((response) => {
        refreshGitInsecureSetting();
      })
      .catch((error) => {
        setError(error);
      });
  };

  const fetchGitInsecureSetting = useCallback(() => {
    return getSettingById("git.insecure.enabled");
  }, []);

  const { data: gitInsecureSetting, requestFetch: refreshGitInsecureSetting } =
    useFetch<boolean>({
      defaultIsFetching: true,
      onFetch: fetchGitInsecureSetting,
    });

  useEffect(() => {
    refreshGitInsecureSetting();
  }, [refreshGitInsecureSetting]);

  return (
    <>
      <PageSection variant={PageSectionVariants.light}>
        <TextContent>
          <Text component="h1">{t("terms.gitConfig")}</Text>
        </TextContent>
      </PageSection>
      <PageSection>
        <Card>
          <CardBody>
            {error && (
              <Alert
                variant="danger"
                isInline
                title={getAxiosErrorMessage(error)}
              />
            )}
            <Switch
              id="git"
              className="repo"
              label="Consume insecure Git repositories"
              aria-label="HTTP Proxy"
              isChecked={gitInsecureSetting === true ? true : false}
              onChange={onChange}
            />
          </CardBody>
        </Card>
      </PageSection>
    </>
  );
};
