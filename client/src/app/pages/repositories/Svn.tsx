import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Card,
  CardBody,
  Content,
  PageSection,
  Switch,
} from "@patternfly/react-core";

import "./Repositories.css";
import { useSetting, useSettingMutation } from "@app/queries/settings";

export const RepositoriesSvn: React.FC = () => {
  const { t } = useTranslation();
  const svnInsecureSetting = useSetting("svn.insecure.enabled");
  const svnInsecureSettingMutation = useSettingMutation("svn.insecure.enabled");

  const onChange = () => {
    if (svnInsecureSetting.isSuccess)
      svnInsecureSettingMutation.mutate(!svnInsecureSetting.data);
  };

  return (
    <>
      <PageSection variant="default">
        <Content component="h1">{t("terms.svnConfig")}</Content>
      </PageSection>
      <PageSection>
        <Card>
          <CardBody>
            {svnInsecureSetting.isError && (
              <Alert
                variant="danger"
                isInline
                title={svnInsecureSetting.error as string}
              />
            )}
            <Switch
              id="svn"
              className="repo"
              label="Consume insecure Subversion repositories"
              aria-label="Insecure Subversion Repositories"
              isChecked={
                svnInsecureSetting.isSuccess ? svnInsecureSetting.data : false
              }
              onChange={onChange}
            />
          </CardBody>
        </Card>
      </PageSection>
    </>
  );
};
