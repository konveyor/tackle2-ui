import React from "react";
import { ListItem } from "@patternfly/react-core";
import { Questionnaire, Thresholds } from "@app/api/models";

export const QuestionnaireThresholdsColumn: React.FC<{
  questionnaire: Questionnaire;
}> = ({ questionnaire }) => {
  const thresholdsToListItems = (thresholds: Thresholds) => {
    const thresholdKeys: (keyof Thresholds)[] = Object.keys(
      thresholds
    ) as (keyof Thresholds)[];

    return (
      <>
        {thresholdKeys.map((color) => {
          const percentage: number = thresholds[color] || 0;
          return (
            <ListItem key={color}>
              {color} {percentage}%
            </ListItem>
          );
        })}
      </>
    );
  };
  return thresholdsToListItems(questionnaire.thresholds || {});
};
