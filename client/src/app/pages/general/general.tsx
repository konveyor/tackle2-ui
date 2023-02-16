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
import { useSetting } from "@app/queries/settings";

export const General: React.FC = () => {
  const { t } = useTranslation();

  const reviewAssessmentSetting = useSetting("review.assessment.required");
  const downloadCSVSetting = useSetting("download.csv.enabled");
  const downloadHTMLSetting = useSetting("download.html.enabled");

  const { control: review } = useForm<Setting>({
    defaultValues: {
      key: "review.assessment.required",
      value: reviewAssessmentSetting.data,
    },
  });

  const { control: csv } = useForm<Setting>({
    defaultValues: {
      key: "download.csv.enabled",
      value: downloadCSVSetting.data,
    },
  });

  const { control: html } = useForm<Setting>({
    defaultValues: {
      key: "download.html.enabled",
      value: downloadHTMLSetting.data,
    },
  });

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
              <Form className={spacing.mMd} onSubmit={() => {}}>
                <Controller
                  control={review}
                  name="value"
                  render={({ field: { onChange, value, name, ref } }) => (
                    <Switch
                      id="review.assessment.required"
                      name={name}
                      label={t("terms.generalAllowApps")}
                      isChecked={value}
                      onChange={onChange}
                      ref={ref}
                    />
                  )}
                />
                <Controller
                  control={csv}
                  name="value"
                  render={({ field: { onChange, value, name, ref } }) => (
                    <Switch
                      id="download.html.enabled"
                      name={name}
                      label={t("terms.generalCSVReports")}
                      isChecked={value}
                      onChange={onChange}
                      ref={ref}
                    />
                  )}
                />
                <Controller
                  control={html}
                  name="value"
                  render={({ field: { onChange, value, name, ref } }) => (
                    <Switch
                      id="download.html.enabled"
                      name={name}
                      label={t("terms.generalHTTPReports")}
                      isChecked={value}
                      onChange={onChange}
                      ref={ref}
                    />
                  )}
                />
              </Form>
            )}
          </CardBody>
        </Card>
      </PageSection>
    </>
  );
};
