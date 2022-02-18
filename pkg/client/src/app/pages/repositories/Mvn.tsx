import * as React from "react";
import {
  Button,
  Card,
  CardBody,
  PageSection,
  PageSectionVariants,
  Switch,
  Text,
  TextContent,
  TextInput,
} from "@patternfly/react-core";
import { useTranslation } from "react-i18next";

import "./Repositories.css";

export const RepositoriesMvn: React.FunctionComponent = () => {
  const { t } = useTranslation();
  const [isInsecure, setInsecure] = React.useState(false);
  const [isForced, setForced] = React.useState(false);

  const onChangeInsecure = () => {
    setInsecure(!isInsecure);
  };

  const onChangeForced = () => {
    setForced(!isForced);
  };

  return (
    <>
      <PageSection variant={PageSectionVariants.light}>
        <TextContent>
          <Text component="h1">{t("terms.mavenConfig")}</Text>
        </TextContent>
      </PageSection>
      <PageSection>
        <Card>
          <CardBody>
            <TextInput
              value={"value"}
              className="repo"
              type="text"
              aria-label="Maven Repository Size"
              isReadOnly
            />
            {"  "}
            <Button variant="link" isInline>
              Clear repository
            </Button>
          </CardBody>
          <CardBody>
            <Switch
              id="maven-update"
              className="repo"
              label="Force update of depencies"
              aria-label="Force update of Maven repositories"
              isChecked={isForced}
              onChange={onChangeForced}
            />
          </CardBody>
          <CardBody>
            <Switch
              id="maven-secure"
              className="repo"
              label="Consume insecure Maven repositories"
              aria-label="Insecure Maven repositories"
              isChecked={isInsecure}
              onChange={onChangeInsecure}
            />
          </CardBody>
        </Card>
      </PageSection>
    </>
  );
};
