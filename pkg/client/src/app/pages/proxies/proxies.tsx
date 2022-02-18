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

export const Proxies: React.FunctionComponent = () => {
  const { t } = useTranslation();
  const [isHttpProxy, setHttpProxy] = React.useState(false);
  const [isHttpsProxy, setHttpsProxy] = React.useState(false);

  const onChangeHttpProxy = () => {
    setHttpProxy(!isHttpProxy);
  };

  const onChangeHttpsProxy = () => {
    setHttpsProxy(!isHttpsProxy);
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
              onChange={onChangeHttpProxy}
            />
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
          </CardBody>
        </Card>
        <Card>
          <CardBody></CardBody>
        </Card>
      </PageSection>
    </>
  );
};
