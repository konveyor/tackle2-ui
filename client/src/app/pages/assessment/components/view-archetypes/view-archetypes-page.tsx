import { useEffect } from "react";
import * as React from "react";
import { Link, useParams } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  PageSection,
  Content,
} from "@patternfly/react-core";

import { Paths, ViewArchetypesRoute } from "@app/Paths";
import { Ref } from "@app/api/models";
import { AppPlaceholder } from "@app/components/AppPlaceholder";
import { ConditionalRender } from "@app/components/ConditionalRender";
import SimpleSelect from "@app/components/FilterToolbar/components/SimpleSelect";
import { useFetchApplicationById } from "@app/queries/applications";
import { useFetchArchetypeById } from "@app/queries/archetypes";
import { formatPath } from "@app/utils/utils";

import ViewArchetypesTable from "./components/view-archetypes-table";

const ViewArchetypes: React.FC = () => {
  const { applicationId, archetypeId } = useParams<ViewArchetypesRoute>();
  const { archetype } = useFetchArchetypeById(archetypeId);
  const { application } = useFetchApplicationById(applicationId);

  const [activeArchetype, setActiveArchetype] = React.useState<Ref | null>(
    null
  );
  useEffect(() => {
    if (archetypeId && archetype) {
      setActiveArchetype({
        id: parseInt(archetypeId, 10),
        name: archetype.name,
      });
    }
  }, [archetypeId, archetype]);

  const archetypeOptions =
    application?.archetypes?.map((ref) => ({
      value: String(ref.id),
      label: ref.name,
    })) ?? [];

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Content>
          <Content component="h1">View Archetypes</Content>
        </Content>
        <Breadcrumb>
          <BreadcrumbItem>
            <Link to={Paths.applications}>Applications</Link>
          </BreadcrumbItem>
          <BreadcrumbItem
            to={formatPath(Paths.applicationAssessmentActions, {
              applicationId,
            })}
          >
            {application?.name}
          </BreadcrumbItem>
          <BreadcrumbItem>
            <Link to={Paths.archetypes}>Archetypes</Link>
          </BreadcrumbItem>
          <BreadcrumbItem to="#" isActive>
            {archetype?.name}
          </BreadcrumbItem>
        </Breadcrumb>
      </PageSection>
      <PageSection hasBodyWrapper={false}>
        <ConditionalRender when={!archetype} then={<AppPlaceholder />}>
          {application?.archetypes && application?.archetypes?.length > 1 && (
            <SimpleSelect
              toggleId="select-archetype-toggle"
              ariaLabel="Select an archetype"
              isFullWidth={false}
              value={activeArchetype ? String(activeArchetype.id) : undefined}
              options={archetypeOptions}
              onSelect={(value) => {
                const ref =
                  application?.archetypes?.find(
                    (a) => String(a.id) === value
                  ) ?? null;
                setActiveArchetype(ref);
              }}
            />
          )}
          <Content>
            {<ViewArchetypesTable archetypeRef={activeArchetype} />}
          </Content>
        </ConditionalRender>
      </PageSection>
    </>
  );
};

export default ViewArchetypes;
