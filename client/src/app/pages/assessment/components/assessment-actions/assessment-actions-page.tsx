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
import AssessmentActionsTable from "./components/assessment-actions-table";
import { useFetchArchetypeById } from "@app/queries/archetypes";
import { useFetchApplicationById } from "@app/queries/applications";
import useIsArchetype from "@app/hooks/useIsArchetype";

const AssessmentActions: React.FC = () => {
  const { applicationId, archetypeId } = useParams<AssessmentActionsRoute>();
  const isArchetype = useIsArchetype();

  const { archetype } = useFetchArchetypeById(archetypeId);
  const { application } = useFetchApplicationById(applicationId);

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
            {isArchetype ? archetype?.name : application?.name}
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
