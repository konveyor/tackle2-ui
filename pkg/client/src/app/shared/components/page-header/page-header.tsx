import React from "react";
import {
  Stack,
  StackItem,
  Split,
  SplitItem,
  TextContent,
  Text,
} from "@patternfly/react-core";
import { BreadCrumbPath } from "../breadcrumb-path";
import { MenuActions } from "../menu-actions";
import { HorizontalNav } from "../horizontal-nav/horizontal-nav";

export interface PageHeaderProps {
  title: string;
  description?: React.ReactNode;
  breadcrumbs: { title: string; path: string | (() => void) }[];
  btnActions?: React.ReactNode;
  menuActions: { label: string; callback: () => void }[];
  navItems?: { title: string; path: string }[];
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  breadcrumbs,
  btnActions,
  menuActions,
  navItems,
}) => {
  return (
    <Stack hasGutter>
      <StackItem>
        {breadcrumbs.length > 0 && <BreadCrumbPath breadcrumbs={breadcrumbs} />}
      </StackItem>
      <StackItem>
        <Split>
          <SplitItem isFilled>
            <TextContent>
              <Text component="h1">{title}</Text>
              {description}
            </TextContent>
          </SplitItem>
          {btnActions && <SplitItem>{btnActions}</SplitItem>}
          {menuActions.length > 0 && (
            <SplitItem>
              <MenuActions actions={menuActions} />
            </SplitItem>
          )}
        </Split>
      </StackItem>
      {navItems && (
        <StackItem>
          <HorizontalNav navItems={navItems} />
        </StackItem>
      )}
    </Stack>
  );
};
