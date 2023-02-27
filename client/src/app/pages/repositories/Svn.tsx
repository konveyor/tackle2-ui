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
import { FlagSetting } from "@app/api/models";

export const RepositoriesSvn: React.FC = () => {
  const { t } = useTranslation();
  const svnInsecureSetting = useSetting<boolean>("svn.insecure.enabled");
  const settingMutationQuery = useSettingMutation();

  const onChange = () => {
    if (svnInsecureSetting.isSuccess) {
      const setting: FlagSetting = {
        key: "svn.insecure.enabled",
        value: !svnInsecureSetting.data as boolean,
      };

      settingMutationQuery.mutate(setting);
    }
  };

  return (
    <>
      <PageSection variant={PageSectionVariants.light}>
        <TextContent>
          <Text component="h1">{t("terms.svnConfig")}</Text>
        </TextContent>
      </PageSection>
      <PageSection>
        <Card>
          <CardBody>
            {svnInsecureSetting.isError && (
              <Alert
                variant="danger"
                isInline
                title={svnInsecureSetting.error}
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
