import * as React from "react";
import { useTranslation } from "react-i18next";
import { Content } from "@patternfly/react-core";

export const SourcePlatformRequired: React.FC<{
  title: string;
}> = ({ title }) => {
  const { t } = useTranslation();

  return (
    <div>
      <Content style={{ marginBottom: "var(--pf-t--global--spacer--lg)" }}>
        <Content component="h3">{title}</Content>
        <Content component="p">
          {t("platformDiscoverWizard.noPlatformSelectedDescription")}
        </Content>
      </Content>
    </div>
  );
};
