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
  const reviewAssessmentSettingMutation = useSettingMutation(
    "review.assessment.required"
  );

  const onChangeReviewAssessmentSetting = () => {
    if (reviewAssessmentSetting.isSuccess)
      reviewAssessmentSettingMutation.mutate(!reviewAssessmentSetting.data);
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
            </Form>
          </CardBody>
        </Card>
      </PageSection>
    </>
  );
};
