import React from "react";
import { Panel, Title, TextContent, PanelMain } from "@patternfly/react-core";
import "./drawer-tabs-container.css";

export const DrawerTabsContainer: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <div className="drawer-tabs-container">{children}</div>;
};

export const DrawerTabContent: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <Panel className={`drawer-tab-content`}>
      <PanelMain>{children}</PanelMain>
    </Panel>
  );
};

export const DrawerTabContentSection: React.FC<{
  label: string;
  children: React.ReactNode;
}> = ({ label, children }) => {
  return (
    <TextContent className="drawer-tab-content__section">
      <Title headingLevel="h4" size="md">
        {label}
      </Title>
      <div className="drawer-tab-content__section-content">{children}</div>
    </TextContent>
  );
};
