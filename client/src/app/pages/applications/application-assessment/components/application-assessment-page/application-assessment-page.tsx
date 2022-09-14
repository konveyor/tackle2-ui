import React from "react";
import { PageSection, PageSectionTypes } from "@patternfly/react-core";
import { Assessment } from "@app/api/models";

import { ApplicationAssessmentPageHeader } from "./application-assessment-page-header";

export interface IApplicationAssessmentPageProps {
  assessment?: Assessment;
  children: any;
}

export const ApplicationAssessmentPage: React.FC<
  IApplicationAssessmentPageProps
> = ({ assessment, children }) => {
  return (
    <>
      <PageSection variant="light">
        <ApplicationAssessmentPageHeader assessment={assessment} />
      </PageSection>
      <PageSection variant="light" type={PageSectionTypes.wizard}>
        {children}
      </PageSection>
    </>
  );
};
