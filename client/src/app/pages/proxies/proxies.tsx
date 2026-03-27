import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardBody,
  Content,
  EmptyState,
  PageSection,
  Spinner,
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
      <PageSection>
        <Content>
          <h1>{t("terms.proxyConfig")}</h1>
          <p>{t("terms.proxyConfigDetails")}</p>
        </Content>
      </PageSection>
      <PageSection>
        <Card>
          <CardBody>
            {isFetching ? (
              <EmptyState
                className={spacing.mtXl}
                titleText={t("message.loadingTripleDot")}
                icon={Spinner}
                headingLevel="h4"
              />
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
