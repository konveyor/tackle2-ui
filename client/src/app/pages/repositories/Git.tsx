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
      <PageSection variant={PageSectionVariants.light}>
        <TextContent>
          <Text component="h1">{t("terms.gitConfig")}</Text>
        </TextContent>
      </PageSection>
      <PageSection>
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
