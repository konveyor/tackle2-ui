import * as React from "react";
import ReactMarkdown from "react-markdown";
import { List, ListItem, TextContent } from "@patternfly/react-core";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import { AnalysisInsightLink } from "@app/api/models";
import ExternalLink from "@app/components/ExternalLink";
import { markdownPFComponents } from "@app/components/markdownPFComponents";

export interface IInsightDescriptionAndLinksProps {
  description: string;
  links?: AnalysisInsightLink[];
  className?: string;
}

export const InsightDescriptionAndLinks: React.FC<
  IInsightDescriptionAndLinksProps
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
