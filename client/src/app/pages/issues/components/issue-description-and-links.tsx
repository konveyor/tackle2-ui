import * as React from "react";
import ReactMarkdown from "react-markdown";
import { TextContent, List, ListItem, Button } from "@patternfly/react-core";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import ExternalLinkSquareAltIcon from "@patternfly/react-icons/dist/esm/icons/external-link-square-alt-icon";

import { AnalysisIssueLink } from "@app/api/models";
import { markdownPFComponents } from "@app/components/markdownPFComponents";

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
            <Button
              variant="link"
              component="a"
              icon={<ExternalLinkSquareAltIcon />}
              iconPosition="right"
              href={link.url}
              target="_blank"
              rel="noreferrer"
            >
              {link.title}
            </Button>
          </ListItem>
        ))}
      </List>
    ) : null}
  </div>
);
