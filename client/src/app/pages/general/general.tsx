import * as React from "react";
import {
  Alert,
  Card,
  CardBody,
  EmptyState,
  EmptyStateIcon,
  Form,
  PageSection,
  PageSectionVariants,
  Spinner,
  Switch,
  Text,
  TextContent,
  Title,
} from "@patternfly/react-core";
import { useTranslation } from "react-i18next";

import "./general.css";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import { useSetting, useSettingMutation } from "@app/queries/settings";

export const General: React.FC = () => {
  const { t } = useTranslation();

  const reviewAssessmentSetting = useSetting("review.assessment.required");
  const downloadHTMLSetting = useSetting("download.html.enabled");
  const downloadCSVSetting = useSetting("download.csv.enabled");
  const reviewAssessmentSettingMutation = useSettingMutation(
    "review.assessment.required"
  );
  const downloadHTMLSettingMutation = useSettingMutation(
    "download.html.enabled"
  );
  const downloadCSVSettingMutation = useSettingMutation("download.csv.enabled");

  const onChangeReviewAssessmentSetting = () => {
    if (reviewAssessmentSetting.isSuccess)
      reviewAssessmentSettingMutation.mutate(!reviewAssessmentSetting.data);
  };

  const onChangeDownloadHTMLSetting = () => {
    if (downloadHTMLSetting.isSuccess)
      downloadHTMLSettingMutation.mutate(!downloadHTMLSetting.data);
  };

  const onChangeDownloadCSVSetting = () => {
    if (downloadCSVSetting.isSuccess)
      downloadCSVSettingMutation.mutate(!downloadCSVSetting.data);
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
            {reviewAssessmentSetting.isError && (
              <Alert
                variant="danger"
                isInline
                title={reviewAssessmentSetting.error}
              />
            )}
            {downloadCSVSetting.isError && (
              <Alert
                variant="danger"
                isInline
                title={downloadCSVSetting.error}
              />
            )}
            {downloadHTMLSetting.isError && (
              <Alert
                variant="danger"
                isInline
                title={downloadHTMLSetting.error}
              />
            )}
            <Form className={spacing.mMd}>
              <Switch
                id="reviewAssessment"
                className="repo"
                label={t("terms.settingsAllowApps")}
                aria-label="Allow applications review without assessment"
                isChecked={
                  reviewAssessmentSetting.isSuccess
                    ? reviewAssessmentSetting.data
                    : false
                }
                onChange={onChangeReviewAssessmentSetting}
              />
              <Switch
                id="downloadHTML"
                className="repo"
                label={t("terms.settingsHTMLReports")}
                aria-label="Allow download HTML Reports"
                isChecked={
                  downloadHTMLSetting.isSuccess
                    ? downloadHTMLSetting.data
                    : false
                }
                onChange={onChangeDownloadHTMLSetting}
              />
              <Switch
                id="downloadCSV"
                className="repo"
                label={t("terms.settingsCSVReports")}
                aria-label="Allow download CSV Reports"
                isChecked={
                  downloadCSVSetting.isSuccess ? downloadCSVSetting.data : false
                }
                onChange={onChangeDownloadCSVSetting}
              />
            </Form>
          </CardBody>
        </Card>
      </PageSection>
    </>
  );
};
