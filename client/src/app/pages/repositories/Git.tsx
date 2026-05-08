import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Card,
  CardBody,
  PageSection,
  Switch,
  Content,
} from "@patternfly/react-core";

import "./Repositories.css";
import { useSetting, useSettingMutation } from "@app/queries/settings";

export const RepositoriesGit: React.FC = () => {
  const { t } = useTranslation();

  const gitInsecureSetting = useSetting("git.insecure.enabled");
  const gitInsecureSettingMutation = useSettingMutation("git.insecure.enabled");

  const onChange = () => {
    if (gitInsecureSetting.isSuccess)
      gitInsecureSettingMutation.mutate(!gitInsecureSetting.data);
  };

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Content>
          <Content component="h1">{t("terms.gitConfig")}</Content>
        </Content>
      </PageSection>
      <PageSection hasBodyWrapper={false}>
        <Card>
          <CardBody>
            {gitInsecureSetting.isError && (
              <Alert
                variant="danger"
                isInline
                title={gitInsecureSetting.error as string}
              />
            )}
            <Switch
              id="git"
              className="repo"
              label="Consume insecure Git repositories"
              aria-label="HTTP Proxy"
              isChecked={
                gitInsecureSetting.isSuccess ? gitInsecureSetting.data : false
              }
              onChange={onChange}
            />
          </CardBody>
        </Card>
      </PageSection>
    </>
  );
};
