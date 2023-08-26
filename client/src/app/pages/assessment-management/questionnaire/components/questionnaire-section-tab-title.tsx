import React from "react";
import { TabTitleText, Badge } from "@patternfly/react-core";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import { CustomYamlAssessmentQuestion } from "@app/api/models";

const QuestionnaireSectionTabTitle: React.FC<{
  isSearching: boolean;
  sectionName: string;
  unfilteredQuestions: CustomYamlAssessmentQuestion[];
  filteredQuestions: CustomYamlAssessmentQuestion[];
}> = ({ isSearching, sectionName, unfilteredQuestions, filteredQuestions }) => (
  <TabTitleText aria-label="vertical" role="region">
    {sectionName}
    <br />
    <small>
      {unfilteredQuestions.length} questions
      {isSearching ? (
        <Badge
          screenReaderText="Questions matching search"
          className={spacing.mlSm}
          isRead={filteredQuestions.length === 0}
        >
          {`${filteredQuestions.length} match${
            filteredQuestions.length === 1 ? "" : "es"
          }`}
        </Badge>
      ) : null}
    </small>
  </TabTitleText>
);

export default QuestionnaireSectionTabTitle;
