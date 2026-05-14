import * as React from "react";
import { useTranslation } from "react-i18next";
import { Content } from "@patternfly/react-core";

import { Section } from "@app/api/models";

export interface IWizardStepNavDescriptionProps {
  section: Section;
}

export const WizardStepNavDescription: React.FC<
  IWizardStepNavDescriptionProps
> = ({ section }) => {
  const { t } = useTranslation();

  return (
    <Content>
      <Content component="small">
        {t("composed.Nquestions", { n: section.questions.length })}
      </Content>
    </Content>
  );
};
