import React from "react";
import {
  Text,
  TextContent,
  PageSection,
  PageSectionVariants,
  Breadcrumb,
  BreadcrumbItem,
} from "@patternfly/react-core";
import { Link, useParams } from "react-router-dom";
import { AssessmentActionsRoute, Paths } from "@app/Paths";
import { ConditionalRender } from "@app/components/ConditionalRender";
import { AppPlaceholder } from "@app/components/AppPlaceholder";
import { useTranslation } from "react-i18next";
import { useFetchApplicationByID } from "@app/queries/applications";
import AssessmentActionsTable from "./components/assessment-actions-table";

const AssessmentActions: React.FC = () => {
  const { applicationId } = useParams<AssessmentActionsRoute>();
  const { application } = useFetchApplicationByID(applicationId || "");
  return (
    <>
      <PageSection variant={PageSectionVariants.light}>
        <TextContent>
          <Text component="h1">Assessment Actions</Text>
        </TextContent>
        <Breadcrumb>
          <BreadcrumbItem>
            <Link to={Paths.applications}>Applications</Link>
          </BreadcrumbItem>
          <BreadcrumbItem to="#" isActive>
            Assessment
          </BreadcrumbItem>
        </Breadcrumb>
      </PageSection>
      <PageSection>
        <ConditionalRender when={!application} then={<AppPlaceholder />}>
          <TextContent>
            <AssessmentActionsTable application={application} />
          </TextContent>
        </ConditionalRender>
      </PageSection>
    </>
  );
};

export default AssessmentActions;
