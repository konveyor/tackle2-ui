import React, { useEffect } from "react";
import {
  Text,
  TextContent,
  PageSection,
  PageSectionVariants,
  Breadcrumb,
  BreadcrumbItem,
} from "@patternfly/react-core";
import { Link, useParams } from "react-router-dom";
import { ViewArchetypesRoute, Paths } from "@app/Paths";
import { ConditionalRender } from "@app/components/ConditionalRender";
import { AppPlaceholder } from "@app/components/AppPlaceholder";
import ViewArchetypesTable from "./components/view-archetypes-table";
import { useFetchArchetypeById } from "@app/queries/archetypes";
import { useFetchApplicationById } from "@app/queries/applications";
import { OptionWithValue, SimpleSelect } from "@app/components/SimpleSelect";
import { Ref } from "@app/api/models";
import { formatPath } from "@app/utils/utils";

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

  function mapRefToOption(ref: Ref | null): OptionWithValue<Ref | null> {
    if (ref) {
      return {
        value: ref,
        toString: () => ref.name,
      };
    } else {
      return {
        value: null,
        toString: () => "All",
      };
    }
  }
  const options: OptionWithValue<Ref | null>[] = [
    ...(application?.archetypes?.map(mapRefToOption) || []),
  ];

  return (
    <>
      <PageSection variant={PageSectionVariants.light}>
        <TextContent>
          <Text component="h1">View Archetypes</Text>
        </TextContent>
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
      <PageSection>
        <ConditionalRender when={!archetype} then={<AppPlaceholder />}>
          {application?.archetypes && application?.archetypes?.length > 1 && (
            <SimpleSelect
              width={300}
              id="archetype-select"
              aria-label="Select an archetype"
              variant="single"
              value={mapRefToOption(activeArchetype)}
              onChange={(selection) => {
                const selectedArchetype =
                  selection as OptionWithValue<Ref | null>;
                setActiveArchetype(selectedArchetype.value);
              }}
              options={options}
            />
          )}
          <TextContent>
            {<ViewArchetypesTable archetypeRef={activeArchetype} />}
          </TextContent>
        </ConditionalRender>
      </PageSection>
    </>
  );
};

export default ViewArchetypes;
