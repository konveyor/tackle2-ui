import * as React from "react";
import { Application } from "@app/api/models";
import {
  IPageDrawerContentProps,
  PageDrawerContent,
} from "@app/shared/page-drawer-context";

export interface IApplicationDetailDrawerProps
  extends Pick<IPageDrawerContentProps, "isExpanded" | "onCloseClick"> {
  application: Application | null;
  showReportsTab?: boolean;
}

export const ApplicationDetailDrawer: React.FC<
  IApplicationDetailDrawerProps
> = ({ isExpanded, onCloseClick, application, showReportsTab = false }) => {
  return (
    <PageDrawerContent
      // TODO(mturley) -- factor out a component for this for both tables
      // TODO(mturley) -- move all content from expanded rows into here!
      // TODO(mturley) -- add filters and other features from new design!
      isExpanded={isExpanded}
      onCloseClick={onCloseClick}
      focusKey={application?.id}
    >
      <h1>TODO: content about app "{application?.name}"</h1>
      {showReportsTab ? <h2>TODO: include the reports tab!</h2> : null}
    </PageDrawerContent>
  );
};
