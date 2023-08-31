import React from "react";
import { useTranslation } from "react-i18next";

import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  List,
  ListItem,
} from "@patternfly/react-core";

import { Application, Assessment } from "@app/api/models";
import { useFetchQuestionnaires } from "@app/queries/questionnaires";

export interface IApplicationDetailsProps {
  application: Application;
  assessment?: Assessment;
}

export const ApplicationDetails: React.FC<IApplicationDetailsProps> = ({
  application,
  assessment,
}) => {
  const { questionnaires } = useFetchQuestionnaires();

  const matchingQuestionnaire = questionnaires.find(
    (questionnaire) => questionnaire.id === assessment?.questionnaire?.id
  );
  const { t } = useTranslation();
  if (!matchingQuestionnaire) {
    return null;
  }

  return (
    <DescriptionList>
      <DescriptionListGroup>
        <DescriptionListTerm>{t("terms.applicationName")}</DescriptionListTerm>
        <DescriptionListDescription>
          {application.name}
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>{t("terms.description")}</DescriptionListTerm>
        <DescriptionListDescription>
          {application.description}
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>{t("terms.assessmentNotes")}</DescriptionListTerm>
        <DescriptionListDescription>
          <List>
            {/* {matchingQuestionnaire.sections
              .filter((f) => f.comment && f.comment.trim().length > 0)
              .map((category, i) => (
                <ListItem key={i}>
                  {category.title}: {category.comment}
                </ListItem>
              ))} */}
          </List>
        </DescriptionListDescription>
      </DescriptionListGroup>
    </DescriptionList>
  );
};
