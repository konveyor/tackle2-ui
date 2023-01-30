import * as React from "react";
import {
  Card,
  CardBody,
  EmptyState,
  EmptyStateIcon,
  PageSection,
  PageSectionVariants,
  Spinner,
  Text,
  TextContent,
  Title,
} from "@patternfly/react-core";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import { useTranslation } from "react-i18next";
import { useFetchWaves } from "@app/queries/waves";
import { ComposableWaveTableWithControls } from "./waves-table/waves-table";

export const Waves: React.FC = () => {
  const { t } = useTranslation();

  const { waves, isFetching, fetchError } = useFetchWaves();

  return (
    <>
      <PageSection variant={PageSectionVariants.light}>
        <TextContent>
          <Text component="h1">{t("terms.migrationWaves")}</Text>
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
              <ComposableWaveTableWithControls
                isLoading={isFetching}
                fetchError={fetchError}
              ></ComposableWaveTableWithControls>
            )}
          </CardBody>
        </Card>
        <Card>
          <CardBody></CardBody>
        </Card>
      </PageSection>
    </>
  );
};
