import * as React from "react";
import {
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
import { Controller, useForm } from "react-hook-form";

import "./general.css";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import { Setting } from "@app/api/models";
import { useSetting, useSettingMutation } from "@app/queries/settings";

export const General: React.FC = () => {
  const { t } = useTranslation();

  const reviewAssessmentSetting = useSetting("review.assessment.required");
  const downloadHTMLSetting = useSetting("download.html.enabled");
  const downloadCSVSetting = useSetting("download.csv.enabled");
  const settingMutationQuery = useSettingMutation();

  const onChangeReviewAssessmentSetting = () => {
    if (reviewAssessmentSetting.isSuccess) {
      const setting: Setting = {
        key: "review.assessment.required",
        value: !reviewAssessmentSetting.data,
      };

      settingMutationQuery.mutate(setting);
    }
  };

  const onChangeDownloadHTMLSetting = () => {
    if (downloadHTMLSetting.isSuccess) {
      const setting: Setting = {
        key: "download.html.enabled",
        value: !downloadHTMLSetting.data,
      };

      settingMutationQuery.mutate(setting);
    }
  };

  const onChangeDownloadCSVSetting = () => {
    if (downloadCSVSetting.isSuccess) {
      const setting: Setting = {
        key: "download.csv.enabled",
        value: !downloadCSVSetting.data,
      };

      settingMutationQuery.mutate(setting);
    }
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
            {reviewAssessmentSetting.isFetching ||
            downloadCSVSetting.isFetching ||
            downloadHTMLSetting.isFetching ? (
              <EmptyState className={spacing.mtXl}>
                <EmptyStateIcon variant="container" component={Spinner} />
                <Title size="lg" headingLevel="h4">
                  Loading
                </Title>
              </EmptyState>
            ) : (
              <Form className={spacing.mMd}>
                <Switch
                  id="git"
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
                  id="git"
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
                  id="git"
                  className="repo"
                  label={t("terms.settingsCSVReports")}
                  aria-label="Allow download CSV Reports"
                  isChecked={
                    downloadCSVSetting.isSuccess
                      ? downloadCSVSetting.data
                      : false
                  }
                  onChange={onChangeDownloadCSVSetting}
                />
              </Form>
            )}
          </CardBody>
        </Card>
      </PageSection>
    </>
  );
};
