import * as React from "react";
import { useTranslation } from "react-i18next";
import { Text, TextContent, Title } from "@patternfly/react-core";

import {
  DetailsContent,
  DetailsContentProps,
} from "../../components/details-content";

export const Review: React.FC<DetailsContentProps> = ({ state }) => {
  const { t } = useTranslation();

  return (
    <>
      <TextContent>
        <Title headingLevel="h3" size="xl">
          {t("analysisProfileWizard.steps.review.title")}
        </Title>
        <Text>{t("analysisProfileWizard.steps.review.description")}</Text>
      </TextContent>

      <DetailsContent state={state} />
    </>
  );
};
