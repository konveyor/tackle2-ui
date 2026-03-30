import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Card,
  CardBody,
  Content,
  Form,
  FormGroup,
  PageSection,
  Switch,
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
      <PageSection variant="default">
        <Content component="h1">{t("terms.generalConfig")}</Content>
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
              <FormGroup fieldId="enable-download-report">
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
              </FormGroup>
            </Form>
          </CardBody>
        </Card>
      </PageSection>
    </>
  );
};
