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

import { useFetchGeneral } from "@app/queries/general";
import { General as GeneralModel } from "@app/api/models";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import "./general.css";

export const General: React.FC = () => {
  const { t } = useTranslation();

  const { general, isFetching } = useFetchGeneral();

  const { control } = useForm<GeneralModel>({
    defaultValues: {
      allowReview: false,
      HTMLReports: false,
      CSVReports: false,
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
            {isFetching ? (
              <EmptyState className={spacing.mtXl}>
                <EmptyStateIcon variant="container" component={Spinner} />
                <Title size="lg" headingLevel="h4">
                  Loading
                </Title>
              </EmptyState>
            ) : (
              <Form className={spacing.mMd} onSubmit={() => {}}>
                <Controller
                  control={control}
                  name="allowReview"
                  render={({ field: { onChange, value, name, ref } }) => (
                    <Switch
                      id={name}
                      name={name}
                      label={t("terms.generalAllowApps")}
                      isChecked={value}
                      onChange={onChange}
                      ref={ref}
                    />
                  )}
                />{" "}
                <Controller
                  control={control}
                  name="HTMLReports"
                  render={({ field: { onChange, value, name, ref } }) => (
                    <Switch
                      id={name}
                      name={name}
                      label={t("terms.generalCSVReports")}
                      isChecked={value}
                      onChange={onChange}
                      ref={ref}
                    />
                  )}
                />{" "}
                <Controller
                  control={control}
                  name="CSVReports"
                  render={({ field: { onChange, value, name, ref } }) => (
                    <Switch
                      id={name}
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
