import React from "react";
import { useTranslation } from "react-i18next";

import { Text, TextContent } from "@patternfly/react-core";
import { QuestionnaireCategory } from "@app/api/models";

export interface IWizardStepNavDescriptionProps {
  category: QuestionnaireCategory;
}

export const WizardStepNavDescription: React.FC<
  IWizardStepNavDescriptionProps
> = ({ category }) => {
  const { t } = useTranslation();

  return (
    <TextContent>
      <Text component="small">
        {t("composed.Nquestions", { n: category.questions.length })}
      </Text>
    </TextContent>
  );
};
