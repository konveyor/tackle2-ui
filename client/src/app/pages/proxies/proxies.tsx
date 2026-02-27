import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardBody,
  EmptyState,
  EmptyStateHeader,
  EmptyStateIcon,
  PageSection,
  PageSectionVariants,
  Spinner,
  Text,
  TextContent,
} from "@patternfly/react-core";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import { Proxy } from "@app/api/models";
import { useFetchProxies } from "@app/queries/proxies";

import { ProxyForm } from "./proxy-form";
import "./proxies.css";

export const Proxies: React.FC = () => {
  const { t } = useTranslation();

  const { proxies, isFetching } = useFetchProxies();

  const existingHttpProxy = proxies.find(
    (proxy: Proxy) => proxy.kind === "http"
  );
  const existingHttpsProxy = proxies.find(
    (proxy: Proxy) => proxy.kind === "https"
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
                <EmptyStateHeader
                  titleText={t("message.loadingTripleDot")}
                  icon={<EmptyStateIcon icon={Spinner} />}
                  headingLevel="h4"
                />
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
