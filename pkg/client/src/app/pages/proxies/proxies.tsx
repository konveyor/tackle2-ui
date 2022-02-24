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
  const [isHttpProxy, setHttpProxy] = React.useState(false);
  const [isHttpsProxy, setHttpsProxy] = React.useState(false);
  const dispatch = useDispatch();

  const onChangeHttpProxy = () => {
    setHttpProxy(!isHttpProxy);
    fetchProxies();
  };

  const onChangeHttpsProxy = () => {
    setHttpsProxy(!isHttpsProxy);
  };

  const handleOnProxyCreated = (response: AxiosResponse<any>) => {
    dispatch(
      alertActions.addSuccess(
        t("toastr.success.added", {
          what: response.data.name,
          type: t("terms.proxy").toLowerCase(),
        })
      )
    );
  };

  const handleOnCancelUpdateProxy = () => {};
  const {
    proxies,
    fetchError: fetchErrorProxies,
    fetchProxies,
  } = useFetchProxies();

  useEffect(() => {
    fetchProxies();
  }, [fetchProxies]);

  const existingHttpProxy = proxies?.data.find(
    (proxy) => proxy.kind === "http"
  );
  const existingHttpsProxy = proxies?.data.find(
    (proxy) => proxy.kind === "https"
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
            <Switch
              id="httpProxy"
              className="proxy"
              label="HTTP proxy"
              aria-label="HTTP Proxy"
              isChecked={isHttpProxy}
              onChange={onChangeHttpProxy}
            />

            {isHttpProxy && (
              <ProxyForm
                proxy={existingHttpProxy}
                isSecure={false}
                onSaved={handleOnProxyCreated}
                onCancel={handleOnCancelUpdateProxy}
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
              onChange={onChangeHttpsProxy}
            />
            {isHttpsProxy && (
              <ProxyForm
                proxy={existingHttpsProxy}
                isSecure={true}
                onSaved={handleOnProxyCreated}
                onCancel={handleOnCancelUpdateProxy}
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
