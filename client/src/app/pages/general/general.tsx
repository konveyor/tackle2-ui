import React from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Card,
  CardBody,
  Form,
  PageSection,
  PageSectionVariants,
  Switch,
  Text,
  TextContent,
} from "@patternfly/react-core";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import { useSetting, useSettingMutation } from "@app/queries/settings";

export const General: React.FC = () => {
  const { t } = useTranslation();

  const enableDownloadSetting = useSetting("download.html.enabled");
  const enableDownloadSettingMutation = useSettingMutation(
    "download.html.enabled"
  );

  const onChangeEnableDownloadSetting = () => {
    enableDownloadSettingMutation.mutate(!enableDownloadSetting.data);
  };

  return (
    <>
      <PageSection variant={PageSectionVariants.light}>
        <TextContent>
          <Text component="h1">{t("terms.generalConfig")}</Text>
        </TextContent>
      </PageSection>
      <PageSection>
        <Card>
          <CardBody>
            {enableDownloadSetting.isError && (
              <Alert
                variant="danger"
                isInline
                title={enableDownloadSetting.error as string}
              />
            )}
            <Form className={spacing.mMd}>
              <Switch
                id="enable-download-report"
                label={t("terms.reportDownloadSetting")}
                aria-label="Allow reports to be downloaded"
                isChecked={
                  enableDownloadSetting.isSuccess
                    ? enableDownloadSetting.data
                    : false
                }
                onChange={onChangeEnableDownloadSetting}
              />
            </Form>
          </CardBody>
        </Card>
      </PageSection>
    </>
  );
};
