import * as React from "react";
import { useTranslation } from "react-i18next";
import { useFormContext } from "react-hook-form";
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  TextContent,
  Text,
} from "@patternfly/react-core";

import { FormValues } from "./discover-import-wizard";

export const Review: React.FC = () => {
  const { t } = useTranslation();
  const { watch } = useFormContext<FormValues>();

  const platform = watch("platform");

  return (
    <div>
      <TextContent style={{ marginBottom: "var(--pf-v5-global--spacer--lg)" }}>
        <Text component="h3">{t("platformDiscoverWizard.review.title")}</Text>
        <Text component="p">
          {t("platformDiscoverWizard.review.description", {
            platformName: platform?.name,
          })}
        </Text>
      </TextContent>

      <DescriptionList>
        <DescriptionListGroup>
          <DescriptionListTerm>{t("terms.platform")}</DescriptionListTerm>
          <DescriptionListDescription>
            {platform?.name}
          </DescriptionListDescription>
        </DescriptionListGroup>

        <DescriptionListGroup>
          <DescriptionListTerm>{t("terms.platformKind")}</DescriptionListTerm>
          <DescriptionListDescription>
            {platform?.kind}
          </DescriptionListDescription>
        </DescriptionListGroup>

        <DescriptionListGroup>
          <DescriptionListTerm>{t("terms.url")}</DescriptionListTerm>
          <DescriptionListDescription>
            {platform?.url || t("terms.notAvailable")}
          </DescriptionListDescription>
        </DescriptionListGroup>

        <DescriptionListGroup>
          <DescriptionListTerm>{t("terms.credentials")}</DescriptionListTerm>
          <DescriptionListDescription>
            {platform?.identity?.name || t("terms.none")}
          </DescriptionListDescription>
        </DescriptionListGroup>
      </DescriptionList>
    </div>
  );
};
