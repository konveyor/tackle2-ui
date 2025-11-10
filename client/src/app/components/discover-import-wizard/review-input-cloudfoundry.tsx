import * as React from "react";
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  List,
  ListItem,
} from "@patternfly/react-core";

import { JsonDocument } from "@app/api/models";
import { EmptyTextMessage } from "@app/components/EmptyTextMessage";

export interface ReviewInputCloudFoundryProps {
  id: string;
  values?: JsonDocument;
}

/**
 * Inputs for CloudFoundry discover applications filter.  This is based on the json schema.
 */
export const ReviewInputCloudFoundry: React.FC<
  ReviewInputCloudFoundryProps
> = ({ id, values }) => {
  if (!values) {
    return <EmptyTextMessage message="No filter values to display" />;
  }

  const organizations = (values.organizations as string[]) ?? [];
  const spaces = (values.spaces as string[]) ?? [];
  const names = (values.names as string[]) ?? [];

  return (
    <DescriptionList isHorizontal isCompact id={id}>
      <DescriptionListGroup>
        <DescriptionListTerm>Organizations</DescriptionListTerm>
        <DescriptionListDescription>
          {organizations.length === 0 ? (
            <EmptyTextMessage message="No organizations specified" />
          ) : (
            <List isPlain>
              {organizations.map((organization) => (
                <ListItem key={organization}>{organization}</ListItem>
              ))}
            </List>
          )}
        </DescriptionListDescription>
      </DescriptionListGroup>

      <DescriptionListGroup>
        <DescriptionListTerm>Spaces</DescriptionListTerm>
        <DescriptionListDescription>
          {spaces.length === 0 ? (
            <EmptyTextMessage message="No spaces specified" />
          ) : (
            <List isPlain>
              {spaces.map((space) => (
                <ListItem key={space}>{space}</ListItem>
              ))}
            </List>
          )}
        </DescriptionListDescription>
      </DescriptionListGroup>

      <DescriptionListGroup>
        <DescriptionListTerm>Names</DescriptionListTerm>
        <DescriptionListDescription>
          {names.length === 0 ? (
            <EmptyTextMessage message="No names specified" />
          ) : (
            <List isPlain>
              {names.map((name) => (
                <ListItem key={name}>{name}</ListItem>
              ))}
            </List>
          )}
        </DescriptionListDescription>
      </DescriptionListGroup>
    </DescriptionList>
  );
};
