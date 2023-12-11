import * as React from "react";
import ReactMarkdown from "react-markdown";
import { TextContent, List, ListItem } from "@patternfly/react-core";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import { AnalysisIssueLink } from "@app/api/models";
import { markdownPFComponents } from "@app/components/markdownPFComponents";
import ExternalLink from "@app/components/ExternalLink";

export interface IIssueDescriptionAndLinksProps {
  description: string;
  links?: AnalysisIssueLink[];
  className?: string;
}

export const IssueDescriptionAndLinks: React.FC<
  IIssueDescriptionAndLinksProps
> = ({ description, links, className = "" }) => (
  <div className={className}>
    <TextContent className={spacing.mbMd}>
      <ReactMarkdown components={markdownPFComponents}>
        {description}
      </ReactMarkdown>
    </TextContent>
    {links?.length ? (
      <List isPlain>
        {links.map((link) => (
          <ListItem key={link.url}>
            <ExternalLink href={link.url}>{link.title}</ExternalLink>
          </ListItem>
        ))}
      </List>
    ) : null}
  </div>
);
