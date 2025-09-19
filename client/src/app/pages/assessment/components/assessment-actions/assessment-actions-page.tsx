import React from "react";
import { Link, useParams } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  PageSection,
  PageSectionVariants,
  Text,
  TextContent,
} from "@patternfly/react-core";

import { AssessmentActionsRoute, Paths } from "@app/Paths";
import { AppPlaceholder } from "@app/components/AppPlaceholder";
import { ConditionalRender } from "@app/components/ConditionalRender";
import useIsArchetype from "@app/hooks/useIsArchetype";
import { useFetchApplicationById } from "@app/queries/applications";
import { useFetchArchetypeById } from "@app/queries/archetypes";

import AssessmentActionsTable from "./components/assessment-actions-table";

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
