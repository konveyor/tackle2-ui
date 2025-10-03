import * as React from "react";
import { useTranslation } from "react-i18next";
import { Text, TextContent } from "@patternfly/react-core";

export const SourcePlatformRequired: React.FC<{
  title: string;
}> = ({ title }) => {
  const { t } = useTranslation();

  return (
    <div>
      <TextContent style={{ marginBottom: "var(--pf-v5-global--spacer--lg)" }}>
        <Text component="h3">{title}</Text>
        <Text component="p">
          {t("platformDiscoverWizard.noPlatformSelectedDescription")}
        </Text>
      </TextContent>
    </div>
  );
};
