import * as React from "react";
import { useTranslation } from "react-i18next";
import { Content, Title } from "@patternfly/react-core";

import {
  DetailsContent,
  DetailsContentProps,
} from "@app/pages/analysis-profiles/components/details-content";

export const Review: React.FC<DetailsContentProps> = ({ state }) => {
  const { t } = useTranslation();

  return (
    <>
      <Content>
        <Title headingLevel="h3" size="xl">
          {t("analysisProfileWizard.steps.review.title")}
        </Title>
        <Content component="p">{t("analysisProfileWizard.steps.review.description")}</Content>
      </Content>

      <DetailsContent state={state} />
    </>
  );
};
