import React from "react";
import { Button, ToolbarItem } from "@patternfly/react-core";

import AngleDownIcon from "@patternfly/react-icons/dist/esm/icons/angle-down-icon";
import AngleRightIcon from "@patternfly/react-icons/dist/esm/icons/angle-right-icon";

export interface ITToolbarBulkExpanderProps {
  areAllExpanded?: boolean;
  onExpandAll?: (flag: boolean) => void;
  isExpandable?: boolean;
}

export const ToolbarBulkExpander = ({
  onExpandAll,
  areAllExpanded,
  isExpandable,
}: React.PropsWithChildren<ITToolbarBulkExpanderProps>): JSX.Element | null => {
  const toggleCollapseAll = (collapse: boolean) => {
    onExpandAll && onExpandAll(!collapse);
  };

  return !isExpandable ? null : (
    <ToolbarItem>
      <Button
        variant="control"
        title={`${!areAllExpanded ? "Expand" : "Collapse"} all`}
        onClick={() => {
          areAllExpanded !== undefined && toggleCollapseAll(areAllExpanded);
        }}
      >
        {areAllExpanded ? <AngleDownIcon /> : <AngleRightIcon />}
      </Button>
    </ToolbarItem>
  );
};
