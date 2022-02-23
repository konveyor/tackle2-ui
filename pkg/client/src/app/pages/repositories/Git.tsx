import * as React from "react";
import {
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

export const RepositoriesGit: React.FunctionComponent = () => {
  const { t } = useTranslation();

  const onChange = () => {
    updateSetting(gitInsecureSetting?.key);
  };

  const fetchGitInsecureSetting = useCallback(() => {
    return getSettingById("git.insecure.enabled");
  }, []);

  const { data: gitInsecureSetting, requestFetch: refreshGitInsecureSetting } =
    useFetch<Setting>({
      defaultIsFetching: true,
      onFetch: fetchGitInsecureSetting,
    });

  useEffect(() => {
    refreshGitInsecureSetting();
  }, [refreshGitInsecureSetting]);

  console.log("gitInsecureSetting", gitInsecureSetting);
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
            <Switch
              id="git"
              className="repo"
              label="Consume insecure Git repositories"
              aria-label="HTTP Proxy"
              isChecked={gitInsecureSetting?.value}
              onChange={onChange}
            />
          </CardBody>
        </Card>
      </PageSection>
    </>
  );
};
