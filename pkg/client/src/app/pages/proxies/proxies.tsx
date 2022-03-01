import * as React from "react";
import {
  Card,
  CardBody,
  PageSection,
  PageSectionVariants,
  Switch,
  Text,
  TextContent,
} from "@patternfly/react-core";
import { useTranslation } from "react-i18next";

import "./proxies.css";
import { ProxyForm } from "./proxy-form";
import { AxiosResponse } from "axios";
import { alertActions } from "@app/store/alert";
import { useDispatch } from "react-redux";
import { useEffect } from "react";
import { useFetchProxies } from "@app/shared/hooks/useFetchProxies";

export const Proxies: React.FunctionComponent = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const onChangeIsHttpProxy = () => {
    setIsHttpProxy(!isHttpProxy);
    fetchProxies();
  };

  const onChangeIsHttpsProxy = () => {
    setIsHttpsProxy(!isHttpsProxy);
    fetchProxies();
  };

  const handleOnProxyCreated = (response: AxiosResponse<any>) => {
    fetchProxies();
    dispatch(
      alertActions.addSuccess(
        t("toastr.success.added", {
          what: response.data.name,
          type: t("terms.proxy").toLowerCase(),
        })
      )
    );
  };

  const { proxies, fetchProxies } = useFetchProxies();

  useEffect(() => {
    fetchProxies();
  }, [fetchProxies]);

  const existingHttpProxy = proxies?.data.find(
    (proxy) => proxy.kind === "http"
  );
  const existingHttpsProxy = proxies?.data.find(
    (proxy) => proxy.kind === "https"
  );
  const [isHttpProxy, setIsHttpProxy] = React.useState(false);
  const [isHttpsProxy, setIsHttpsProxy] = React.useState(false);
  useEffect(() => {
    setIsHttpProxy(!!existingHttpProxy);
    setIsHttpsProxy(!!existingHttpsProxy);
  }, []);
  const handleOnDeleteProxy = () => {
    fetchProxies();
  };
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
            <Switch
              id="httpProxy"
              className="proxy"
              label="HTTP proxy"
              aria-label="HTTP Proxy"
              isChecked={isHttpProxy}
              onChange={onChangeIsHttpProxy}
            />

            {isHttpProxy && (
              <ProxyForm
                proxy={existingHttpProxy}
                isSecure={false}
                onSaved={handleOnProxyCreated}
                onDelete={handleOnDeleteProxy}
              />
            )}
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <Switch
              id="httpsProxy"
              className="proxy"
              label="HTTPS proxy"
              aria-label="HTTPS Proxy"
              isChecked={isHttpsProxy}
              onChange={onChangeIsHttpsProxy}
            />
            {isHttpsProxy && (
              <ProxyForm
                proxy={existingHttpsProxy}
                isSecure={true}
                onSaved={handleOnProxyCreated}
                onDelete={handleOnDeleteProxy}
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
