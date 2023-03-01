import * as React from "react";
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from "@patternfly/react-core";
import {
  ApplicationDetailDrawer,
  IApplicationDetailDrawerProps,
} from "./application-detail-drawer";

export const ApplicationDetailDrawerAssessment: React.FC<
  Pick<IApplicationDetailDrawerProps, "application" | "onCloseClick">
> = ({ application, onCloseClick }) => {
  return (
    <ApplicationDetailDrawer
      application={application}
      onCloseClick={onCloseClick}
      detailsTabDescriptionList={
        <DescriptionList
          isHorizontal
          isCompact
          columnModifier={{ default: "1Col" }}
          horizontalTermWidthModifier={{
            default: "14ch",
          }}
        >
          <DescriptionListGroup>
            <DescriptionListTerm>Proposed action</DescriptionListTerm>
            <DescriptionListDescription>TODO</DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Effort estimate</DescriptionListTerm>
            <DescriptionListDescription>TODO</DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Business criticality</DescriptionListTerm>
            <DescriptionListDescription>TODO</DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Work priority</DescriptionListTerm>
            <DescriptionListDescription>TODO</DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Risk</DescriptionListTerm>
            <DescriptionListDescription>TODO</DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      }
    />
  );
};
