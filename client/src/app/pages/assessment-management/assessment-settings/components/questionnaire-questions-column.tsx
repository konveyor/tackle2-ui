import * as React from "react";
import { Content } from "@patternfly/react-core";

import { Questionnaire } from "@app/api/models";

export const QuestionnaireQuestionsColumn: React.FC<{
  questionnaire: Questionnaire;
}> = ({ questionnaire }) => {
  const totalQuestions = (questionnaire.sections || []).reduce(
    (total, section) => {
      return total + (section.questions ? section.questions.length : 0);
    },
    0
  );
  return <Content component="p">{totalQuestions}</Content>;
};
