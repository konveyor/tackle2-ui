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
import { ProxyForm } from "./proxy-form";
import { useFetchProxies } from "@app/queries/proxies";
import "./proxies.css";

export const Proxies: React.FunctionComponent = () => {
  const { t } = useTranslation();

  const { proxies, isFetching } = useFetchProxies();

  const existingHttpProxy = proxies.find((proxy: any) => proxy.kind === "http");
  const existingHttpsProxy = proxies.find(
    (proxy: any) => proxy.kind === "https"
  );

  return (
    <>
      <PageSection variant={PageSectionVariants.light}>
        <TextContent>
          <Text component="h1">{t("terms.proxyConfig")}</Text>
          <Text>{t("terms.proxyConfigDetails")}</Text>
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
              <ProxyForm
                httpProxy={existingHttpProxy}
                httpsProxy={existingHttpsProxy}
              />
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
