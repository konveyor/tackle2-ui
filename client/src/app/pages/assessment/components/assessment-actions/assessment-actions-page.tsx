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
import { useFetchApplicationByID } from "@app/queries/applications";
import AssessmentActionsTable from "./components/assessment-actions-table";
import { useFetchArchetypeById } from "@app/queries/archetypes";

const AssessmentActions: React.FC = () => {
  const { applicationId, archetypeId } = useParams<AssessmentActionsRoute>();
  const isArchetype = location.pathname.includes("/archetypes/");
  console.log("isArchetype", isArchetype);

  const { application } = useFetchApplicationByID(applicationId || "");
  const { archetype } = useFetchArchetypeById(archetypeId || "");

  console.log("archetype", archetype);
  return (
    <>
      <PageSection variant={PageSectionVariants.light}>
        <TextContent>
          <Text component="h1">Assessment Actions</Text>
        </TextContent>
        <Breadcrumb>
          {isArchetype ? (
            <BreadcrumbItem>
              <Link to={Paths.archetypes}>Archetypes</Link>
            </BreadcrumbItem>
          ) : (
            <BreadcrumbItem>
              <Link to={Paths.applications}>Applications</Link>
            </BreadcrumbItem>
          )}
          <BreadcrumbItem to="#" isActive>
            Assessment
          </BreadcrumbItem>
        </Breadcrumb>
      </PageSection>
      <PageSection>
        {isArchetype ? (
          <ConditionalRender when={!archetype} then={<AppPlaceholder />}>
            <TextContent>
              {archetype ? (
                <AssessmentActionsTable archetype={archetype} />
              ) : null}
            </TextContent>
          </ConditionalRender>
        ) : (
          <ConditionalRender when={!application} then={<AppPlaceholder />}>
            <TextContent>
              {application ? (
                <AssessmentActionsTable application={application} />
              ) : null}
            </TextContent>
          </ConditionalRender>
        )}
      </PageSection>
    </>
  );
};

export default AssessmentActions;
