import React from "react";
import { Text } from "@patternfly/react-core";

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
  return <Text>{totalQuestions}</Text>;
};
