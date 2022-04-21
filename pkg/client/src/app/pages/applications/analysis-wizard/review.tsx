import * as React from "react";
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  List,
  ListItem,
  Text,
  TextContent,
  Title,
} from "@patternfly/react-core";
import { useFormContext } from "react-hook-form";

import { Application } from "@app/api/models";
import { IAnalysisWizardFormValues } from "./analysis-wizard";

interface IReview {
  applications: Application[];
}

const defaultScopes: Map<string, string> = new Map([
  ["app", "Application and internal dependencies"],
  ["oss", "Known Open Source libraries"],
  ["select", "List of packages to be analyzed manually"],
]);

export const Review: React.FunctionComponent<IReview> = ({ applications }) => {
  const { getValues } = useFormContext<IAnalysisWizardFormValues>();
  const {
    mode,
    targets,
    sources,
    withKnown,
    includedPackages,
    excludedPackages,
    customRulesFiles,
    excludedRulesTags,
  } = getValues();

  return (
    <>
      <TextContent>
        <Title headingLevel="h3" size="xl">
          Review analysis details
        </Title>
        <Text>Review the information below, then run the analysis.</Text>
      </TextContent>
      <DescriptionList isHorizontal>
        <DescriptionListGroup>
          <DescriptionListTerm>Applications</DescriptionListTerm>
          <DescriptionListDescription id="applications">
            <List isPlain>
              {applications.map((app) => (
                <ListItem key={app.id}>{app.name}</ListItem>
              ))}
            </List>
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>Mode</DescriptionListTerm>
          <DescriptionListDescription id="mode">
            {mode}
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>
            {targets.length > 1 ? "Targets" : "Target"}
          </DescriptionListTerm>
          <DescriptionListDescription id="targets">
            <List isPlain>
              {targets.map((target, index) => (
                <ListItem key={index}>{target}</ListItem>
              ))}
            </List>
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>
            {targets.length > 1 ? "Sources" : "Source"}
          </DescriptionListTerm>
          <DescriptionListDescription id="sources">
            <List isPlain>
              {sources.map((source, index) => (
                <ListItem key={index}>{source}</ListItem>
              ))}
            </List>
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>Scope</DescriptionListTerm>
          <DescriptionListDescription id="scope">
            <List isPlain>
              {withKnown.split(",").map((scope, index) => (
                <ListItem key={index}>{defaultScopes.get(scope)}</ListItem>
              ))}
            </List>
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>Included packages</DescriptionListTerm>
          <DescriptionListDescription id="included-packages">
            <List isPlain>
              {includedPackages.map((pkg, index) => (
                <ListItem key={index}>{pkg}</ListItem>
              ))}
            </List>
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>Excluded packages</DescriptionListTerm>
          <DescriptionListDescription id="excluded-packages">
            <List isPlain>
              {excludedPackages.map((pkg, index) => (
                <ListItem key={index}>{pkg}</ListItem>
              ))}
            </List>
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>Custom rules</DescriptionListTerm>
          <DescriptionListDescription id="rules">
            <List isPlain>
              {customRulesFiles.map((rule, index) => (
                <ListItem key={index}>{rule.fileName}</ListItem>
              ))}
            </List>
          </DescriptionListDescription>
        </DescriptionListGroup>{" "}
        <DescriptionListGroup>
          <DescriptionListTerm>Excluded rules tags</DescriptionListTerm>
          <DescriptionListDescription id="excluded-rules-tags">
            <List isPlain>
              {excludedRulesTags.map((tag, index) => (
                <ListItem key={index}>{tag}</ListItem>
              ))}
            </List>
          </DescriptionListDescription>
        </DescriptionListGroup>
      </DescriptionList>
    </>
  );
};
