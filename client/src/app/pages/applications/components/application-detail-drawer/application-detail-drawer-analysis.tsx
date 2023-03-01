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

export const ApplicationDetailDrawerAnalysis: React.FC<
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
            <DescriptionListTerm>Credentials</DescriptionListTerm>
            <DescriptionListDescription>TODO</DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Analysis</DescriptionListTerm>
            <DescriptionListDescription>TODO</DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      }
      showReportsTab
    />
  );
};
