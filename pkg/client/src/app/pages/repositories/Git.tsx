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

import "./Repositories.css";

export const RepositoriesGit: React.FunctionComponent = () => {
  const { t } = useTranslation();
  const [isInsecure, setInsecure] = React.useState(false);

  const onChange = () => {
    setInsecure(!isInsecure);
  };

  return (
    <>
      <PageSection variant={PageSectionVariants.light}>
        <TextContent>
          <Text component="h1">{t("terms.gitConfig")}</Text>
        </TextContent>
      </PageSection>
      <PageSection>
        <Card>
          <CardBody>
            <Switch
              id="git"
              className="repo"
              label="Consume insecure Git repositories"
              aria-label="HTTP Proxy"
              isChecked={isInsecure}
              onChange={onChange}
            />
          </CardBody>
        </Card>
      </PageSection>
    </>
  );
};
