import * as React from "react";
import {
  Split,
  SplitItem,
  Stack,
  StackItem,
  Text,
  TextContent,
} from "@patternfly/react-core";

import { BreadCrumbPath } from "./BreadCrumbPath";
import { HorizontalNav } from "./HorizontalNav";

export interface PageHeaderProps {
  title: string;
  description?: React.ReactNode;
  breadcrumbs: { title: string; path?: string | (() => void) }[];
  btnActions?: React.ReactNode;
  navItems?: { title: string; path: string }[];
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  breadcrumbs,
  btnActions,
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
