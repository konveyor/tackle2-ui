import React from "react";
import {
  Drawer,
  DrawerContent,
  DrawerContentBody,
  DrawerPanelContent,
  Page,
  SkipToContent,
} from "@patternfly/react-core";
import pageStyles from "@patternfly/react-styles/css/components/Page/page";

import { HeaderApp } from "../HeaderApp";
import { SidebarApp } from "../SidebarApp";
import { Notifications } from "@app/shared/components/Notifications";
import { PageDrawerContext } from "@app/shared/page-drawer-context";

export interface DefaultLayoutProps {}

export const DefaultLayout: React.FC<DefaultLayoutProps> = ({ children }) => {
  const pageId = "main-content-page-layout-horizontal-nav";
  const PageSkipToContent = (
    <SkipToContent href={`#${pageId}`}>Skip to content</SkipToContent>
  );

  const { isDrawerMounted, isDrawerExpanded, drawerFocusRef, drawerChildren } =
    React.useContext(PageDrawerContext);

  const pageContent = (
    <>
      {children}
      <Notifications />
    </>
  );

  return (
    <Page
      header={<HeaderApp />}
      sidebar={<SidebarApp />}
      isManagedSidebar
      skipToContent={PageSkipToContent}
      mainContainerId={pageId}
    >
      {isDrawerMounted ? (
        <div className={pageStyles.pageDrawer}>
          <Drawer
            isExpanded={isDrawerExpanded}
            onExpand={() => drawerFocusRef?.current?.focus()}
            position="right"
          >
            <DrawerContent
              panelContent={
                <DrawerPanelContent
                  isResizable
                  id="page-drawer-content"
                  defaultSize="500px"
                  minSize="150px"
                >
                  {drawerChildren}
                </DrawerPanelContent>
              }
            >
              <DrawerContentBody>{pageContent}</DrawerContentBody>
            </DrawerContent>
          </Drawer>
        </div>
      ) : (
        pageContent
      )}
    </Page>
  );
};
