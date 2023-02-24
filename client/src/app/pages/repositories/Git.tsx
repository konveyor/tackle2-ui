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
import { Setting, SettingBoolean } from "@app/api/models";
import { useSetting, useSettingMutation } from "@app/queries/settings";

export const RepositoriesGit: React.FC = () => {
  const { t } = useTranslation();

  const gitInsecureSetting = useSetting("git.insecure.enabled");
  const settingMutationQuery = useSettingMutation();

  const onChange = () => {
    if (gitInsecureSetting.isSuccess) {
      const setting: SettingBoolean = {
        key: "git.insecure.enabled",
        value: !gitInsecureSetting.data,
      };

      settingMutationQuery.mutate(setting);
    }
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
                title={gitInsecureSetting.error}
              />
            )}
            <Switch
              id="git"
              className="repo"
              label="Consume insecure Git repositories"
              aria-label="HTTP Proxy"
              isChecked={
                gitInsecureSetting.isSuccess
                  ? (gitInsecureSetting.data as boolean)
                  : false
              }
              onChange={onChange}
            />
          </CardBody>
        </Card>
      </PageSection>
    </>
  );
};
