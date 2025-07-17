import React, { useRef } from "react";
import { Page, SkipToContent } from "@patternfly/react-core";

import { HeaderApp } from "../HeaderApp";
import { SidebarApp } from "../SidebarApp";
import { Notifications } from "@app/components/Notifications";
import { PageContentWithDrawerProvider } from "@app/components/PageDrawerContext";
import { TaskManagerDrawer } from "@app/components/task-manager/TaskManagerDrawer";
import { useTaskManagerContext } from "@app/components/task-manager/TaskManagerContext";

export interface DefaultLayoutProps {
  children?: React.ReactNode;
}

export const DefaultLayout: React.FC<DefaultLayoutProps> = ({ children }) => {
  const pageId = "main-content-page-layout-horizontal-nav";
  const PageSkipToContent = (
    <SkipToContent href={`#${pageId}`}>Skip to content</SkipToContent>
  );

  const drawerRef = useRef<HTMLElement | null>(null);
  const focusDrawer = () => {
    if (drawerRef.current === null) {
      return;
    }
    const firstTabbableItem = drawerRef.current.querySelector("a, button") as
      | HTMLAnchorElement
      | HTMLButtonElement
      | null;
    firstTabbableItem?.focus();
  };

  const { isExpanded } = useTaskManagerContext();

  return (
    <Page
      header={<HeaderApp />}
      sidebar={<SidebarApp />}
      isManagedSidebar
      skipToContent={PageSkipToContent}
      mainContainerId={pageId}
      isNotificationDrawerExpanded={isExpanded}
      notificationDrawer={<TaskManagerDrawer ref={drawerRef} />}
      onNotificationDrawerExpand={() => focusDrawer()}
    >
      <PageContentWithDrawerProvider>
        {children}
        <Notifications />
      </PageContentWithDrawerProvider>
    </Page>
  );
};
