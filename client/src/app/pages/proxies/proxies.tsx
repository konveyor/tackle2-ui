import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardBody,
  EmptyState,
  PageSection,
  Spinner,
  Content,
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
      <PageSection hasBodyWrapper={false}>
        <Content>
          <Content component="h1">{t("terms.proxyConfig")}</Content>
          <Content component="p">{t("terms.proxyConfigDetails")}</Content>
        </Content>
      </PageSection>
      <PageSection hasBodyWrapper={false}>
        <Card>
          <CardBody>
            {isFetching ? (
              <EmptyState
                headingLevel="h4"
                icon={Spinner}
                titleText={t("message.loadingTripleDot")}
                className={spacing.mtXl}
              ></EmptyState>
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
