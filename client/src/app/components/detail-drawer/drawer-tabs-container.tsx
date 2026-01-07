import * as React from "react";
import { Panel, PanelMain, Title } from "@patternfly/react-core";
import "./drawer-tabs-container.css";

/**
 * A container for `Tabs` in the content of the drawer.  Also helps the tabs render better
 * in a drawer width.
 */
export const DrawerTabsContainer: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <div className="drawer-tabs-container">{children}</div>;
};

/**
 * A container for the content of a `Tab` to allow scrolling of just the tab's content.
 */
export const DrawerTabContent: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <Panel className={`drawer-tab-content`}>
      <PanelMain>{children}</PanelMain>
    </Panel>
  );
};

/**
 * Provide layout for sections of a tab's content.  Left content insets and gaps above
 * labels provide better visual hierarchy.
 */
export const DrawerTabContentSection: React.FC<{
  label?: string;
  children: React.ReactNode;
}> = ({ label, children }) => {
  return (
    <div className="drawer-tab-content__section">
      {label && (
        <Title
          headingLevel="h4"
          size="md"
          className="drawer-tab-content__section-label"
        >
          {label}
        </Title>
      )}
      <div className="drawer-tab-content__section-content">{children}</div>
    </div>
  );
};
